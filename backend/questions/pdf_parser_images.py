"""
Extract questions from exam PDFs as image crops (not OCR text).

Preserves matrices, trigonometry, limits, fractions, etc. exactly as printed.
"""

import io
import json
import os
import re
import time
from typing import Dict, List, Optional, Tuple

from PIL import Image

try:
    import pdf2image
    from pdf2image import convert_from_path as _convert_from_path
except ImportError:  # pragma: no cover - surfaced when upload runs
    pdf2image = None  # type: ignore[assignment]
    _convert_from_path = None  # type: ignore[assignment,misc]

def _django_setting(name: str, default=None):
    try:
        from django.conf import settings as dj_settings

        return getattr(dj_settings, name, default)
    except Exception:
        return default


def _gemini_models_to_try() -> List[str]:
    primary = os.environ.get("GEMINI_MODEL") or _django_setting(
        "GEMINI_MODEL", "gemini-2.0-flash-lite"
    )
    extra = os.environ.get("GEMINI_MODEL_FALLBACKS") or _django_setting(
        "GEMINI_MODEL_FALLBACKS",
        "gemini-2.0-flash-lite,gemini-1.5-flash",
    )
    models = [primary] + [m.strip() for m in str(extra).split(",") if m.strip()]
    seen = set()
    ordered: List[str] = []
    for name in models:
        if name not in seen:
            seen.add(name)
            ordered.append(name)
    return ordered


def _skip_gemini() -> bool:
    if _django_setting("PDF_SKIP_GEMINI", False):
        return True
    return os.environ.get("PDF_SKIP_GEMINI", "").lower() in ("1", "true", "yes")


def _is_quota_error(exc: BaseException) -> bool:
    text = str(exc).upper()
    return "429" in text or "RESOURCE_EXHAUSTED" in text or "QUOTA" in text


DPI = 200
VISION_MAX_SIDE = 1280

_BOX_PROMPT = """
You are analyzing an exam page image. Each question (stem + options A B C D) must be kept intact.

Return ONLY valid JSON — an array of objects:
[
  {
    "number": 1,
    "subject": "math",
    "box": { "top": 80, "left": 40, "bottom": 420, "right": 960 }
  }
]

Rules:
- Coordinates are 0–1000 scale (top-left origin): top, left, bottom, right integers.
- Include the FULL question and ALL four options inside each box when possible.
- One object per complete question on this page.
- subject must be one of: math, physics, chemistry, english, unknown
- Do NOT transcribe question text. Only detection boxes.
- If no questions, return [].
"""

_ANSWER_KEY_PROMPT = """
Extract the answer key from this page.

Return ONLY a JSON object mapping question number to answer letter:
{"1": "A", "2": "C", "3": "B"}

Use uppercase letters A–D only. No markdown.
"""


def _detect_poppler_path() -> Optional[str]:
    env = os.environ.get("POPPLER_PATH")
    if env and os.path.isdir(env):
        return env
    for candidate in (
        "/opt/homebrew/bin",
        "/usr/local/bin",
        "/usr/bin",
    ):
        if os.path.isfile(os.path.join(candidate, "poppler", "pdftoppm")) or os.path.isfile(
            os.path.join(candidate, "pdftoppm")
        ):
            return candidate
    return None


def _pdf_to_images(pdf_path: str, dpi: int = DPI) -> List[Image.Image]:
    if pdf2image is None:
        raise ImportError(
            "pdf2image is required for PDF upload. Install it with: pip install pdf2image"
        )

    kwargs = {"dpi": dpi, "fmt": "jpeg"}
    poppler = _detect_poppler_path()
    if poppler:
        kwargs["poppler_path"] = poppler
    return _convert_from_path(pdf_path, **kwargs)


def _gemini_client(api_key: str):
    from google import genai

    return genai.Client(api_key=api_key)


def _clean_json(raw: str) -> str:
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


def _resize_for_vision(pil_img: Image.Image, max_side: int = VISION_MAX_SIDE) -> Image.Image:
    w, h = pil_img.size
    if max(w, h) <= max_side:
        return pil_img
    scale = max_side / max(w, h)
    return pil_img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)


def _gemini_vision_once(client, pil_img: Image.Image, prompt: str, model: str) -> str:
    from google.genai import types

    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=85)
    buf.seek(0)

    response = client.models.generate_content(
        model=model,
        contents=[
            prompt,
            types.Part.from_bytes(data=buf.getvalue(), mime_type="image/jpeg"),
        ],
        config={"temperature": 0, "max_output_tokens": 8192},
    )

    try:
        return (response.text or "").strip()
    except Exception:
        pass

    try:
        parts = response.candidates[0].content.parts
        return "".join(p.text for p in parts if hasattr(p, "text")).strip()
    except Exception:
        return ""


def _gemini_vision(client, pil_img: Image.Image, prompt: str) -> str:
    """Call Gemini with retries, model fallbacks, and smaller images to save quota."""
    img = _resize_for_vision(pil_img)
    last_error: Optional[BaseException] = None

    for model in _gemini_models_to_try():
        for attempt in range(3):
            try:
                return _gemini_vision_once(client, img, prompt, model)
            except Exception as exc:
                last_error = exc
                if not _is_quota_error(exc):
                    raise
                wait_s = min(90, 35 * (attempt + 1))
                print(
                    f"[PDF Images] Quota/rate limit on {model}, "
                    f"retry in {wait_s}s (attempt {attempt + 1}/3)"
                )
                time.sleep(wait_s)

    if last_error:
        raise last_error
    return ""


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


def _parse_json_object(raw: str) -> dict:
    raw = _clean_json(raw)
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass
    return {}


def _crop_box(img: Image.Image, box: dict, padding: int = 8) -> Image.Image:
    w, h = img.size
    top = int(box.get("top", 0) / 1000 * h)
    left = int(box.get("left", 0) / 1000 * w)
    bottom = int(box.get("bottom", 1000) / 1000 * h)
    right = int(box.get("right", 1000) / 1000 * w)

    top = max(0, top - padding)
    left = max(0, left - padding)
    bottom = min(h, bottom + padding)
    right = min(w, right + padding)

    if bottom <= top or right <= left:
        return img.copy()

    return img.crop((left, top, right, bottom))


def _detect_boxes(client, page_img: Image.Image) -> List[dict]:
    raw = _gemini_vision(client, page_img, _BOX_PROMPT)
    items = _parse_json_array(raw)
    valid = []
    for item in items:
        if not isinstance(item, dict):
            continue
        box = item.get("box")
        if not isinstance(box, dict):
            continue
        if not all(k in box for k in ("top", "left", "bottom", "right")):
            continue
        valid.append(item)
    return valid


def _fallback_page_as_single_question(page_img: Image.Image, page_num: int) -> List[dict]:
    """If box detection fails, use the full page as one question image."""
    return [
        {
            "number": page_num,
            "subject": "unknown",
            "box": {"top": 0, "left": 0, "bottom": 1000, "right": 1000},
        }
    ]


def parse_pdf_to_image_questions(
    pdf_path: str,
    output_dir: str,
    api_key: Optional[str] = None,
    answer_key_page: str = "last",
    skip_gemini: Optional[bool] = None,
) -> List[Dict]:
    """
    Returns list of dicts ready for Question creation:
    number, subject, question (placeholder), options (labels), answer, image_path (relative to MEDIA)
    """
    os.makedirs(output_dir, exist_ok=True)
    if skip_gemini is None:
        skip_ai = _skip_gemini()
    else:
        skip_ai = skip_gemini

    resolved_key = api_key or os.environ.get("GEMINI_API_KEY", "")
    if not skip_ai and not resolved_key:
        raise ValueError("Missing GEMINI_API_KEY for PDF image extraction (or enable free mode)")
    client = None if skip_ai else _gemini_client(resolved_key)
    if skip_ai:
        print("[PDF Images] PDF_SKIP_GEMINI=true — one full-page image per sheet (no API calls)")

    pages = _pdf_to_images(pdf_path)
    total = len(pages)

    if total == 0:
        return []

    if total == 1:
        question_pages = pages
        answer_img = None
    elif answer_key_page == "last":
        question_pages = pages[:-1]
        answer_img = pages[-1]
    elif answer_key_page == "first":
        question_pages = pages[1:]
        answer_img = pages[0]
    else:
        question_pages = pages
        answer_img = None

    answer_key: Dict[str, str] = {}
    gemini_quota_exhausted = False

    if answer_img is not None and not skip_ai and client is not None:
        try:
            raw = _gemini_vision(client, answer_img, _ANSWER_KEY_PROMPT)
            parsed = _parse_json_object(raw)
            answer_key = {str(k): str(v).upper().strip()[:1] for k, v in parsed.items()}
        except Exception as exc:
            if _is_quota_error(exc):
                gemini_quota_exhausted = True
                print(f"[PDF Images] Answer key skipped (quota): {exc}")
            else:
                print(f"[PDF Images] Answer key parse failed: {exc}")

    results: List[Dict] = []
    q_counter = 0

    for page_index, page_img in enumerate(question_pages):
        page_no = page_index + 1
        if skip_ai or gemini_quota_exhausted:
            boxes = _fallback_page_as_single_question(page_img, page_no)
        else:
            try:
                boxes = _detect_boxes(client, page_img)
            except Exception as exc:
                if _is_quota_error(exc):
                    gemini_quota_exhausted = True
                    print(f"[PDF Images] Quota hit — using full-page crops for remaining pages")
                    boxes = _fallback_page_as_single_question(page_img, page_no)
                else:
                    raise
            if not boxes:
                boxes = _fallback_page_as_single_question(page_img, page_no)

        for item in boxes:
            q_counter += 1
            num = item.get("number", q_counter)
            try:
                num = int(num)
            except (TypeError, ValueError):
                num = q_counter

            crop = _crop_box(page_img, item["box"])
            rel_name = f"q_{num:04d}_p{page_no}.jpg"
            abs_path = os.path.join(output_dir, rel_name)
            crop.save(abs_path, "JPEG", quality=92)

            rel_media = os.path.relpath(abs_path, start=os.path.dirname(output_dir))
            # store path relative to MEDIA_ROOT subfolder test_{id}
            image_rel = rel_name

            ans = answer_key.get(str(num), "")

            results.append(
                {
                    "number": num,
                    "subject": str(item.get("subject", "math")).lower()[:20],
                    "question": f"Question {num} (see image)",
                    "options": [],
                    "type": "mcq",
                    "answer": ans,
                    "image_filename": rel_name,
                    "image_abs_path": abs_path,
                    "use_image_display": True,
                }
            )

    # dedupe by number — keep largest image path
    by_num: Dict[int, dict] = {}
    for q in results:
        n = q["number"]
        if n not in by_num:
            by_num[n] = q
    final = [by_num[k] for k in sorted(by_num.keys())]
    return final
