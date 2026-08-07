"""
Extract questions from exam PDFs as image crops (not OCR text).

Preserves matrices, trigonometry, limits, fractions, etc. exactly as printed.
Uses PyMuPDF instead of pdf2image — no poppler needed on Render!
"""

import io
import json
import os
import re
import subprocess
import tempfile
import time
from typing import Dict, List, Optional, Tuple

from PIL import Image


# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

DPI = 150
VISION_MAX_SIDE = 1280


# ─────────────────────────────────────────────
# DJANGO SETTINGS HELPER
# ─────────────────────────────────────────────

def _django_setting(name: str, default=None):
    try:
        from django.conf import settings as dj_settings
        return getattr(dj_settings, name, default)
    except Exception:
        return default


def _gemini_models_to_try() -> List[str]:
    primary = os.environ.get("GEMINI_MODEL") or _django_setting(
        "GEMINI_MODEL",
        "gemini-2.0-flash-lite"
    )

    extra = os.environ.get("GEMINI_MODEL_FALLBACKS") or _django_setting(
        "GEMINI_MODEL_FALLBACKS",
        "gemini-2.0-flash,gemini-2.0-flash-lite,gemini-flash-latest",
    )

    models = [primary] + [
        m.strip() for m in str(extra).split(",") if m.strip()
    ]

    # Map deprecated/failing models to working ones
    mapped_models = []
    for m in models:
        name = m.lower().strip()
        if name == "gemini-1.5-flash":
            name = "gemini-flash-latest"
        elif name == "models/gemini-1.5-flash":
            name = "models/gemini-flash-latest"
        mapped_models.append(name)

    seen = set()
    ordered = []

    for name in mapped_models:
        if name not in seen:
            seen.add(name)
            ordered.append(name)

    return ordered


def _skip_gemini() -> bool:
    if _django_setting("PDF_SKIP_GEMINI", False):
        return True

    return os.environ.get(
        "PDF_SKIP_GEMINI",
        ""
    ).lower() in ("1", "true", "yes")


def _is_quota_error(exc: BaseException) -> bool:
    text = str(exc).upper()

    if "LIMIT: 0" in text or "LIMIT:0" in text or "LIMIT 0" in text:
        return False

    return (
        "429" in text or
        "RESOURCE_EXHAUSTED" in text or
        "QUOTA" in text
    )


# ─────────────────────────────────────────────
# PDF TO IMAGES — PyMuPDF
# ─────────────────────────────────────────────

def _render_page_as_image(pdf_path: str, page_idx: int, dpi: int = DPI) -> Image.Image:
    try:
        import fitz
    except ImportError:
        raise ImportError(
            "PyMuPDF is required. Install with: pip install pymupdf"
        )

    doc = fitz.open(pdf_path)
    page = doc[page_idx]
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)
    img = Image.frombytes(
        "RGB",
        [pix.width, pix.height],
        pix.samples
    )
    doc.close()

    try:
        fitz.tools.shrink_memory()
    except Exception:
        pass

    return img


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def _question_page_indices(
    total_pages: int,
    answer_key_page: str,
    skip_first_pages: int = 1,
) -> List[int]:

    if total_pages <= 1:
        return list(range(total_pages))

    if answer_key_page == "last":
        indices = list(range(total_pages - 1))

    elif answer_key_page == "first":
        indices = list(range(1, total_pages))

    else:
        indices = list(range(total_pages))

    return [idx for idx in indices if idx >= skip_first_pages]


def _clean_option_text(option: str) -> str:
    option = re.sub(r"\s+", " ", option or "").strip()
    option = option.strip("_ \t")
    return option


_ANSWER_KEY_PROMPT = """
You are given an answer key page from an exam. Extract each question number and its selected multiple-choice answer letter.

Return only a plain text list or JSON mapping. Examples:
1. A
2. C
3. B

or
{
  "1": "A",
  "2": "C"
}

If you are unsure about a line, omit it.
"""


def _normalize_answer_letter(raw_answer: str) -> str:
    if not raw_answer:
        return ""

    text = str(raw_answer).strip().upper()
    text = re.sub(r"^(?:OPTION|OPT|ANSWER)\b[\s\)\.:\-]*", "", text, flags=re.IGNORECASE).strip()
    text = re.sub(r"^[\(\)\.:\-\s]+", "", text)

    match = re.search(r"\b([A-D])\b", text)
    return match.group(1) if match else ""


def _extract_answer_key_from_text(raw_text: str) -> dict:
    answers = {}

    if not raw_text:
        return answers

    cleaned = re.sub(r"[\r\n]+", " ", str(raw_text))
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    for question_number, answer_letter in re.findall(
        r"(\d{1,3})\s*[\)\.\:\-]?\s*([A-D])\b",
        cleaned,
        flags=re.IGNORECASE,
    ):
        normalized = _normalize_answer_letter(answer_letter)
        if normalized:
            answers[int(question_number)] = normalized

    return answers


def _extract_answer_key_from_pdf(pdf_path: str, page_index: int) -> dict:
    try:
        import fitz
    except ImportError:
        return {}

    doc = None
    try:
        doc = fitz.open(pdf_path)
        page = doc.load_page(page_index)
        raw_text = page.get_text("text") or ""
    except Exception:
        return {}
    finally:
        if doc is not None:
            try:
                doc.close()
            except Exception:
                pass

    return _extract_answer_key_from_text(raw_text)


def _image_to_text(img: Image.Image) -> str:
    try:
        import pytesseract
        return pytesseract.image_to_string(
            img.convert("L"),
            config="--psm 6"
        )
    except Exception:
        pass

    tmp_name = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp_name = tmp.name
            img.convert("L").save(tmp_name)

        result = subprocess.run(
            ["tesseract", tmp_name, "stdout", "--psm", "6"],
            capture_output=True,
            text=True,
            check=False,
        )
        return result.stdout or ""
    except Exception:
        return ""
    finally:
        if tmp_name:
            try:
                os.unlink(tmp_name)
            except Exception:
                pass


def _extract_answer_key_from_image(page_img: Image.Image) -> dict:
    raw_text = _image_to_text(page_img)
    return _extract_answer_key_from_text(raw_text)


def _extract_answer_key_from_ai(client, page_img: Image.Image) -> dict:
    if not client:
        return {}

    raw_text = _gemini_vision(
        client,
        page_img,
        _ANSWER_KEY_PROMPT,
    )

    return _extract_answer_key_from_text(raw_text)


def _detect_subject_from_text(raw_text: str) -> Optional[str]:
    if not raw_text:
        return None

    text = str(raw_text).lower()

    english_keywords = [
        "grammar", "comprehension", "poem", "passage", "reading", "essay",
        "synonym", "antonym", "letter", "story", "vocabulary", "preposition",
        "pronoun", "adjective", "adverb", "conjunction", "tense", "sentence",
        "spelling", "word", "meaning", "phrase", "clause", "punctuation",
        "comprehend", "write", "fill in the blank", "blanks", "opposite",
        "similar", "spelt", "underlined", "idiom", "metaphor", "simile",
        "author", "passage", "comprehension", "english", "verbal", "analogy",
    ]
    math_keywords = [
        "equation", "function", "matrix", "determinant", "algebra", "geometry",
        "trigonometry", "probability", "ratio", "percentage", "integral", "derivative",
        "logarithm", "sin", "cos", "tan", "sec", "csc", "cot", "limit",
        "sequence", "series", "vector", "calculus", "differential", "theorem",
        "proof", "solve", "evaluate", "find the value", "coefficients", "roots",
    ]
    mechanics_keywords = [
        "mechanics", "force", "coplanar", "concurrent", "resultant", "friction",
        "centroid", "moment of inertia", "truss", "kinematics", "kinetics",
        "work energy", "impulse", "momentum", "equilibrium", "lamis theorem",
        "lamis", "support reaction", "shear force", "bending moment", "projectile",
        "velocity", "acceleration", "newtons law", "d alembert", "damper",
    ]
    graphics_keywords = [
        "graphics", "projection", "orthographic", "isometric", "plane", "solid",
        "section of solid", "development of surfaces", "intersection", "conic",
        "ellipse", "parabola", "hyperbola", "scale", "involute", "cycloid",
        "drawing", "dimensioning", "first angle", "third angle", "true length",
    ]
    civil_keywords = [
        "civil", "surveying", "leveling", "concrete", "cement", "brick",
        "foundation", "soil mechanics", "beam", "column", "slab", "building material",
        "aggregates", "slump test", "chain surveying", "compass surveying",
        "contouring", "theodolite", "curing", "workability", "stone", "masonry",
    ]
    mechanical_keywords = [
        "mechanical", "thermodynamics", "entropy", "enthalpy", "engine", "boiler",
        "turbine", "refrigeration", "pump", "gear", "clutch", "brake", "coupling",
        "ic engine", "carnot cycle", "cop", "refrigerant", "four stroke", "two stroke",
        "internal combustion", "lubrication", "governor", "flywheel",
    ]
    computer_keywords = [
        "computer", "programming", "software", "algorithm", "data structure",
        "operating system", "cpu", "ram", "rom", "python", "java", "c++",
        "pointer", "array", "stack", "queue", "database", "sql", "binary",
        "hexadecimal", "compiler", "interpreter", "memory", "processor",
        "network", "lan", "wan", "internet", "browser", "class", "object",
    ]
    electrical_keywords = [
        "electrical", "transformer", "motor", "generator", "ac circuit",
        "dc circuit", "three phase", "induction motor", "alternator",
        "magnetic circuit", "faradays law", "lenzs law", "power factor",
        "kcl", "kvl", "ohms law", "phase angle", "apparent power", "active power",
    ]
    electronics_keywords = [
        "electronics", "semiconductor", "diode", "transistor", "bjt", "fet",
        "op-amp", "operational amplifier", "logic gate", "rectifier", "microprocessor",
        "embedded", "flip-flop", "digital electronics", "amplifier", "zener",
        "led", "p-n junction", "analog", "boolean algebra", "k-map", "register",
    ]

    groups = [
        ("english", english_keywords),
        ("math", math_keywords),
        ("engineering mechanics", mechanics_keywords),
        ("engineering graphics", graphics_keywords),
        ("general engineering civil", civil_keywords),
        ("general engineering mechanical", mechanical_keywords),
        ("general engineering computer", computer_keywords),
        ("general engineering electrical", electrical_keywords),
        ("general engineering electronics", electronics_keywords),
    ]

    scores = {}
    for name, words in groups:
        count = 0
        for word in words:
            count += len(re.findall(rf"\b{re.escape(word)}\b", text))
        scores[name] = count

    best = max(scores.items(), key=lambda kv: (kv[1], kv[0]))[0]

    if scores.get(best, 0) == 0:
        return None

    return best


# ─────────────────────────────────────────────
# QUESTION PARSER
# ─────────────────────────────────────────────

def _parse_question_text(raw_text: str, number: int) -> dict:

    raw_text = raw_text or ""

    text = re.sub(r"\s+", " ", raw_text).strip()

    text = re.sub(
        rf"^\s*(?:Q(?:uestion)?\.?\s*)?{number}\s*(?:[\):\-]|\.(?!\d))\s*",
        "",
        text,
        flags=re.IGNORECASE,
    ).strip()

    line_start_pattern = re.compile(
        r"^\s*\(?([A-D])\)?\s*[\).:\-]\s*(.*)$",
        re.IGNORECASE,
    )

    options_by_letter = {}

    question_lines = []

    current_letter = None

    for raw_line in raw_text.splitlines():

        line = re.sub(r"\s+", " ", raw_line).strip()

        if not line:
            continue

        line = re.sub(
            rf"^\s*(?:Q(?:uestion)?\.?\s*)?{number}\s*(?:[\):\-]|\.(?!\d))\s*",
            "",
            line,
            flags=re.IGNORECASE,
        ).strip()

        if not line:
            continue

        match = line_start_pattern.match(line)

        if match:

            current_letter = match.group(1).upper()

            value = _clean_option_text(match.group(2))

            options_by_letter[current_letter] = value

            continue

        if current_letter:
            options_by_letter[current_letter] = (
                _clean_option_text(
                    f"{options_by_letter[current_letter]} {line}"
                )
            )
        else:
            question_lines.append(line)

    options = [
        _clean_option_text(
            options_by_letter.get(letter, "")
        )
        for letter in ("A", "B", "C", "D")
    ]

    question_text = " ".join(question_lines).strip()

    return {
        "question": question_text or f"Question {number}",
        "options": options,
    }


# ─────────────────────────────────────────────
# MATH / DIAGRAM DETECTION
# ─────────────────────────────────────────────

def _looks_like_math_or_diagram(page, rect, text: str) -> bool:

    lower_text = (text or "").lower()

    math_or_diagram_words = (
        "diagram",
        "figure",
        "graph",
        "shown below",
        "given below",
        "following figure",
        "circuit",
        "triangle",
        "matrix",
        "determinant",
        "integral",
        "differentiate",
        "derivative",
        "sin",
        "cos",
        "tan",
        "log",
        "limit",
        "adj",
        "vertices",
        "points",
        "collinear",
        "parabola",
        "circle",
        "radius",
        "tangent",
        "equation",
        "singular",
        "probability",
    )

    math_symbols = set(
        "√∫∑πθλμ≤≥≠≈±×÷∞∂∇∝∈∉⊂⊆∪∩"
    )

    if any(word in lower_text for word in math_or_diagram_words):
        return True

    if any(symbol in text for symbol in math_symbols):
        return True

    return False


# ─────────────────────────────────────────────
# OCR DISABLED
# ─────────────────────────────────────────────

def _ocr_question_crop(crop: Image.Image, number: int) -> dict:
    return {
        "question": f"Question {number} (see image)",
        "options": ["", "", "", ""],
        "has_options": False,
    }


# ─────────────────────────────────────────────
# TEXT PDF QUESTION DETECTION
# ─────────────────────────────────────────────

def _detect_text_question_boxes(
    pdf_path: str,
    page_indices: List[int],
) -> Dict[int, List[dict]]:

    try:
        import fitz
    except ImportError:
        return {}

    question_start_re = re.compile(
        r"^\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,4})\s*(?:[\):\-]|\.(?!\d))"
    )

    detected = {}

    doc = fitz.open(pdf_path)

    try:
        for original_page_index in page_indices:

            page = doc[original_page_index]

            page_w = float(page.rect.width) or 1.0
            page_h = float(page.rect.height) or 1.0

            text_dict = page.get_text("dict")

            starts = []

            for block in text_dict.get("blocks", []):

                for line in block.get("lines", []):

                    text = "".join(
                        span.get("text", "")
                        for span in line.get("spans", [])
                    ).strip()

                    match = question_start_re.match(text)

                    if not match:
                        continue

                    number = int(match.group(1))

                    if number < 1:
                        continue

                    top = float(
                        line.get(
                            "bbox",
                            [0, 0, page_w, page_h]
                        )[1]
                    )

                    starts.append((number, top))

            if not starts:
                continue

            starts.sort(key=lambda item: item[1])

            unique_starts = []

            for number, top in starts:

                if (
                    unique_starts and
                    abs(unique_starts[-1][1] - top) < 20
                ):
                    continue

                unique_starts.append((number, top))

            if len(unique_starts) == 1:

                number, top = unique_starts[0]

                rect = fitz.Rect(
                    0,
                    max(0, top - 6),
                    page_w,
                    page_h
                )

                question_text = page.get_text(
                    "text",
                    clip=rect
                ).strip()

                parsed = _parse_question_text(
                    question_text,
                    number
                )

                subject = _detect_subject_from_text(question_text)

                image_required = _looks_like_math_or_diagram(
                    page,
                    rect,
                    question_text
                )

                detected[original_page_index] = [{
                    "number": number,
                    "subject": subject,
                    "box": {
                        "top": int(max(0, top - 6) / page_h * 1000),
                        "left": 0,
                        "bottom": 1000,
                        "right": 1000,
                    },
                    "question": parsed["question"],
                    "options": parsed["options"],
                    "image_required": image_required,
                    "use_image_display": True,
                }]

                continue

            boxes = []

            for idx, (number, top) in enumerate(unique_starts):

                next_top = (
                    unique_starts[idx + 1][1]
                    if idx + 1 < len(unique_starts)
                    else page_h
                )

                top = max(0, top - 6)

                bottom = min(page_h, next_top - 12)

                if bottom <= top + 20:
                    continue

                rect = fitz.Rect(
                    0,
                    top,
                    page_w,
                    bottom
                )

                question_text = page.get_text(
                    "text",
                    clip=rect
                ).strip()

                parsed = _parse_question_text(
                    question_text,
                    number
                )

                subject = _detect_subject_from_text(question_text)

                image_required = _looks_like_math_or_diagram(
                    page,
                    rect,
                    question_text
                )

                boxes.append({
                    "number": number,
                    "subject": subject,
                    "box": {
                        "top": int(top / page_h * 1000),
                        "left": 0,
                        "bottom": int(bottom / page_h * 1000),
                        "right": 1000,
                    },
                    "question": parsed["question"],
                    "options": parsed["options"],
                    "image_required": image_required,
                    "use_image_display": True,
                })

            if boxes:
                detected[original_page_index] = boxes

    finally:
        doc.close()

    return detected


# ─────────────────────────────────────────────
# PROMPTS
# ─────────────────────────────────────────────

_BOX_PROMPT = """
You are analyzing an exam page containing multiple-choice questions.
Identify the bounding boxes for the question body and each of its multiple-choice options (A, B, C, D) separately.

CRITICAL INSTRUCTIONS:
1. For each multiple-choice question on the page, identify:
   - "question_box": The bounding box for the question number, question text, and any associated formulas, equations, or diagrams. This box MUST EXCLUDE the multiple-choice options (A, B, C, D) themselves.
   - "option_a_box": The separate bounding box containing Option A.
   - "option_b_box": The separate bounding box containing Option B.
   - "option_c_box": The separate bounding box containing Option C.
   - "option_d_box": The separate bounding box containing Option D.
2. Coordinates are normalized from 0 to 1000 relative to the page dimensions (top: 0 is the top edge, bottom: 1000 is the bottom edge, left: 0 is the left edge, right: 1000 is the right edge).
3. If the options are not clearly separable or if it is not a multiple-choice question, just return "question_box" and omit the option boxes.
4. Return ONLY a valid JSON array of objects. Do not include markdown code block formatting or backticks.

[
  {
    "number": 1,
    "subject": "math",
    "question_box": {
      "top": 50,
      "left": 30,
      "bottom": 250,
      "right": 970
    },
    "option_a_box": {
      "top": 265,
      "left": 30,
      "bottom": 310,
      "right": 970
    },
    "option_b_box": {
      "top": 320,
      "left": 30,
      "bottom": 365,
      "right": 970
    },
    "option_c_box": {
      "top": 375,
      "left": 30,
      "bottom": 420,
      "right": 970
    },
    "option_d_box": {
      "top": 430,
      "left": 30,
      "bottom": 475,
      "right": 970
    }
  }
]
"""


# ─────────────────────────────────────────────
# GEMINI
# ─────────────────────────────────────────────

def _gemini_client(api_key: str):
    import google.generativeai as old_genai
    old_genai.configure(api_key=api_key)
    return old_genai


def _clean_json(raw: str) -> str:

    raw = re.sub(
        r"^```(?:json)?\s*",
        "",
        raw.strip()
    )

    raw = re.sub(r"\s*```$", "", raw)

    return raw.strip()


def _resize_for_vision(
    pil_img: Image.Image,
    max_side: int = VISION_MAX_SIDE
) -> Image.Image:

    w, h = pil_img.size

    if max(w, h) <= max_side:
        return pil_img

    scale = max_side / max(w, h)

    return pil_img.resize(
        (int(w * scale), int(h * scale)),
        Image.Resampling.LANCZOS
    )


def _gemini_vision_once(
    client,
    pil_img: Image.Image,
    prompt: str,
    model: str
) -> str:
    config = {
        "temperature": 0,
        "max_output_tokens": 8192,
    }

    model_instance = client.GenerativeModel(
        model_name=model,
        generation_config=config
    )

    response = model_instance.generate_content([prompt, pil_img])

    try:
        return (response.text or "").strip()
    except Exception:
        return ""


def _gemini_vision(
    client,
    pil_img: Image.Image,
    prompt: str
) -> str:

    img = _resize_for_vision(pil_img)

    last_error = None

    for model in _gemini_models_to_try():

        for attempt in range(3):

            try:
                return _gemini_vision_once(
                    client,
                    img,
                    prompt,
                    model
                )

            except Exception as exc:

                last_error = exc

                if not _is_quota_error(exc):
                    raise

                wait_s = min(
                    90,
                    35 * (attempt + 1)
                )

                time.sleep(wait_s)

    if last_error:
        raise last_error

    return ""


# ─────────────────────────────────────────────
# JSON PARSERS
# ─────────────────────────────────────────────

def _parse_json_array(raw: str) -> list:

    raw = _clean_json(raw)

    if not raw:
        return []

    try:
        data = json.loads(raw)

        if isinstance(data, list):
            return data

    except json.JSONDecodeError:
        pass

    match = re.search(r"\[.*\]", raw, re.DOTALL)

    if match:
        try:
            data = json.loads(match.group(0))

            if isinstance(data, list):
                return data

        except json.JSONDecodeError:
            pass

    return []


# ─────────────────────────────────────────────
# BOX OVERLAP
# ─────────────────────────────────────────────

def _box_overlap(a, b):

    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
        return 0

    inter = (
        (inter_x2 - inter_x1) *
        (inter_y2 - inter_y1)
    )

    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)

    return inter / min(area_a, area_b)


# ─────────────────────────────────────────────
# CROPPING
# ─────────────────────────────────────────────

def _crop_box(
    img: Image.Image,
    box: dict,
    padding_top: int = 15,
    padding_bottom: int = 40,
    padding_left: int = 20,
    padding_right: int = 20
) -> Image.Image:

    w, h = img.size

    top = int(box.get("top", 0) / 1000 * h)
    left = int(box.get("left", 0) / 1000 * w)
    bottom = int(box.get("bottom", 1000) / 1000 * h)
    right = int(box.get("right", 1000) / 1000 * w)

    top = max(0, top - padding_top)
    left = max(0, left - padding_left)

    bottom = min(h, bottom + padding_bottom)
    right = min(w, right + padding_right)

    if bottom <= top or right <= left:
        return img.copy()

    return img.crop((left, top, right, bottom))


# ─────────────────────────────────────────────
# GEMINI BOX DETECTION
# ─────────────────────────────────────────────

def _detect_boxes(
    client,
    page_img: Image.Image
) -> List[dict]:

    raw = _gemini_vision(
        client,
        page_img,
        _BOX_PROMPT
    )

    items = _parse_json_array(raw)

    valid = []

    for item in items:

        if not isinstance(item, dict):
            continue

        if "question_box" in item and "box" not in item:
            item["box"] = item["question_box"]

        box = item.get("box")

        if not isinstance(box, dict):
            continue

        if not all(
            k in box
            for k in ("top", "left", "bottom", "right")
        ):
            continue

        valid.append(item)

    cleaned = []

    for item in valid:

        box = item["box"]

        current = (
            box["left"],
            box["top"],
            box["right"],
            box["bottom"],
        )

        duplicate = False

        for prev in cleaned:

            pb = prev["box"]

            previous = (
                pb["left"],
                pb["top"],
                pb["right"],
                pb["bottom"],
            )

            if _box_overlap(current, previous) > 0.8:
                duplicate = True
                break

        if not duplicate:
            cleaned.append(item)

    return cleaned


# ─────────────────────────────────────────────
# FALLBACK
# ─────────────────────────────────────────────

def _fallback_page_as_single_question(
    page_img: Image.Image,
    page_num: int
) -> List[dict]:

    subject_text = _image_to_text(page_img)
    subject = _detect_subject_from_text(subject_text) or "physics"

    return [
        {
            "subject": subject,
            "box": {
                "top": 0,
                "left": 0,
                "bottom": 333,
                "right": 1000,
            },
        },
        {
            "subject": subject,
            "box": {
                "top": 333,
                "left": 0,
                "bottom": 666,
                "right": 1000,
            },
        },
        {
            "subject": subject,
            "box": {
                "top": 666,
                "left": 0,
                "bottom": 1000,
                "right": 1000,
            },
        },
    ]


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def parse_pdf_to_image_questions(
    pdf_path: str,
    output_dir: str,
    api_key: Optional[str] = None,
    answer_key_page: str = "last",
    skip_gemini: Optional[bool] = None,
    skip_first_pages: int = 1,
) -> List[Dict]:

    os.makedirs(output_dir, exist_ok=True)

    if skip_gemini is None:
        skip_ai = _skip_gemini()
    else:
        skip_ai = skip_gemini

    resolved_key = (
        api_key or
        os.environ.get("GEMINI_API_KEY", "")
    )

    if not skip_ai and not resolved_key:
        raise ValueError("Missing GEMINI_API_KEY")

    client = None if skip_ai else _gemini_client(resolved_key)

    import fitz
    doc = fitz.open(pdf_path)
    total = len(doc)
    doc.close()

    if total == 0:
        return []

    answer_key_index = None
    if total > 1:
        if answer_key_page == "last":
            answer_key_index = total - 1
        elif answer_key_page == "first":
            answer_key_index = 0

    question_page_indices = _question_page_indices(
        total,
        answer_key_page,
        skip_first_pages=skip_first_pages,
    )

    answer_key_image = None
    if answer_key_index is not None and answer_key_index < total:
        answer_key_image = _render_page_as_image(pdf_path, answer_key_index, dpi=DPI)

    text_boxes_by_page = (
        _detect_text_question_boxes(
            pdf_path,
            question_page_indices
        )
        if skip_ai
        else {}
    )

    answer_key_map = {}
    if answer_key_image is not None:
        answer_key_map = _extract_answer_key_from_pdf(
            pdf_path,
            answer_key_index,
        ) or {}

        if not answer_key_map:
            answer_key_map = _extract_answer_key_from_image(
                answer_key_image,
            ) or {}

        if not answer_key_map and not skip_ai and client is not None:
            answer_key_map = _extract_answer_key_from_ai(
                client,
                answer_key_image,
            )
        # Free memory immediately
        answer_key_image = None

    results = []

    q_counter = 0

    for original_page_index in question_page_indices:

        page_no = original_page_index + 1
        page_img = _render_page_as_image(pdf_path, original_page_index, dpi=DPI)

        if skip_ai:

            boxes = (
                text_boxes_by_page.get(original_page_index)
                or _fallback_page_as_single_question(
                    page_img,
                    page_no
                )
            )

        else:

            try:
                boxes = _detect_boxes(
                    client,
                    page_img
                )

            except Exception as exc:

                if _is_quota_error(exc):

                    boxes = _fallback_page_as_single_question(
                        page_img,
                        page_no
                    )

                else:
                    raise

            if not boxes:
                boxes = _fallback_page_as_single_question(
                    page_img,
                    page_no
                )

        for item in boxes:

            q_counter += 1

            num = item.get("number", q_counter)

            try:
                num = int(num)

            except Exception:
                num = q_counter

            crop = _crop_box(
                page_img,
                item["box"]
            )

            rel_name = f"q_{num:04d}_p{page_no}.jpg"

            abs_path = os.path.join(
                output_dir,
                rel_name
            )

            crop.save(
                abs_path,
                "JPEG",
                quality=95
            )

            # Crop option images if present
            option_images = {}
            for opt in ("a", "b", "c", "d"):
                opt_box_key = f"option_{opt}_box"
                if opt_box_key in item and isinstance(item[opt_box_key], dict):
                    opt_box = item[opt_box_key]
                    if all(k in opt_box for k in ("top", "left", "bottom", "right")):
                        # Crop option box with smaller option-appropriate padding
                        opt_crop = _crop_box(
                            page_img,
                            opt_box,
                            padding_top=5,
                            padding_bottom=5,
                            padding_left=5,
                            padding_right=5
                        )
                        opt_rel_name = f"q_{num:04d}_p{page_no}_opt_{opt}.jpg"
                        opt_abs_path = os.path.join(output_dir, opt_rel_name)
                        opt_crop.save(
                            opt_abs_path,
                            "JPEG",
                            quality=95
                        )
                        option_images[f"option_{opt}_image_filename"] = opt_rel_name
                        option_images[f"option_{opt}_image_abs_path"] = opt_abs_path

            # High-precision subject classification using extracted text / OCR
            extracted_text = ""
            try:
                page = doc[original_page_index]
                page_w = float(page.rect.width) or 1.0
                page_h = float(page.rect.height) or 1.0
                
                box = item["box"]
                top = int(box.get("top", 0) / 1000 * page_h)
                left = int(box.get("left", 0) / 1000 * page_w)
                bottom = int(box.get("bottom", 1000) / 1000 * page_h)
                right = int(box.get("right", 1000) / 1000 * page_w)
                
                rect = fitz.Rect(left, top, right, bottom)
                extracted_text = page.get_text("text", clip=rect).strip()
            except Exception:
                pass

            if not extracted_text:
                extracted_text = _image_to_text(crop) or ""

            subject = _detect_subject_from_text(extracted_text)

            allowed_subjects = {
                "english": "english",
                "math": "math",
                "mathematics": "math",
                "engineering mechanics": "engineering mechanics",
                "engineering graphics": "engineering graphics",
                "engineering_graphics": "engineering graphics",
                "engg graphics": "engineering graphics",
                "civil": "general engineering civil",
                "general engineering civil": "general engineering civil",
                "mechanical": "general engineering mechanical",
                "general engineering mechanical": "general engineering mechanical",
                "computer": "general engineering computer",
                "computer science": "general engineering computer",
                "general engineering computer": "general engineering computer",
                "electrical": "general engineering electrical",
                "electrical engineering": "general engineering electrical",
                "general engineering electrical": "general engineering electrical",
                "electronic": "general engineering electronics",
                "electronics": "general engineering electronics",
                "electronics engineering": "general engineering electronics",
                "ec": "general engineering electronics",
                "ece": "general engineering electronics",
                "general engineering electronics": "general engineering electronics",
            }

            if not subject:
                # Fallback 1: Gemini's prediction
                g_subj = str(item.get("subject", "")).lower().strip()
                subject = allowed_subjects.get(g_subj, g_subj)

            subject = allowed_subjects.get(subject, subject or "math")

            q_data = {
                "number": num,
                "subject": subject,
                "question": f"Question {num} (see image)",
                "options": ["", "", "", ""],
                "type": "mcq",
                "answer": answer_key_map.get(num, ""),
                "image_filename": rel_name,
                "image_abs_path": abs_path,
                "use_image_display": True,
                "extracted_text": extracted_text,
            }
            q_data.update(option_images)
            # If AI didn't provide option text and no separate option images exist,
            # attempt OCR on the question crop to extract options as text.
            has_option_images = any(
                key in q_data for key in (
                    "option_a_image_abs_path",
                    "option_b_image_abs_path",
                    "option_c_image_abs_path",
                    "option_d_image_abs_path",
                )
            )

            if (not has_option_images) or all(not s.strip() for s in q_data.get("options", ["", "", "", ""])):
                try:
                    ocr_text = _image_to_text(crop) or ""
                    parsed = _parse_question_text(ocr_text, num)
                    parsed_options = parsed.get("options", ["", "", "", ""])
                    # only replace if we found non-empty option texts
                    if any(o.strip() for o in parsed_options):
                        q_data["options"] = parsed_options
                        # prefer readable question text from OCR if available
                        if parsed.get("question") and not q_data.get("question"):
                            q_data["question"] = parsed.get("question")
                except Exception:
                    pass
            results.append(q_data)
        # Clear the page image from memory
        page_img = None

        import gc
        gc.collect()

    # Pass 2: Resolve dominant subject for fallback questions
    subject_counts = {}
    for q in results:
        sub = q["subject"]
        if sub != "math":  # count non-fallback subjects
            subject_counts[sub] = subject_counts.get(sub, 0) + 1

    dominant_subject = None
    if subject_counts:
        best_sub, count = max(subject_counts.items(), key=lambda kv: kv[1])
        if count > len(results) * 0.4:  # if a subject covers > 40% of the questions
            dominant_subject = best_sub

    if dominant_subject:
        for q in results:
            if q["subject"] == "math":
                text = q.get("extracted_text", "").lower()
                # Check for math indicators
                has_math_indicators = any(sym in text for sym in ["=", "+", "\\", "$", "integral", "matrix", "derivative", "trigonometry", "algebra"])
                if not has_math_indicators:
                    q["subject"] = dominant_subject

    # Clean up temporary field
    for q in results:
        if "extracted_text" in q:
            del q["extracted_text"]

    by_num = {}

    for q in results:

        n = q["number"]

        if n not in by_num:
            by_num[n] = q

    final = [
        by_num[k]
        for k in sorted(by_num.keys())
    ]

    print(
        f"[PDF Images] Total questions extracted: {len(final)}"
    )

    return final