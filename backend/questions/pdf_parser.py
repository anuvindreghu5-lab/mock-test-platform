"""
backend/questions/pdf_parser.py

Stable Gemini PDF Parser
"""

import os
import re
import io
import json

from typing import Dict, List, Optional

#from pdf2image import convert_from_path


# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

GEMINI_MODEL = "gemini-2.0-flash"

DPI = 180


# ─────────────────────────────────────────────
# SIMPLE STABLE PROMPT
# ─────────────────────────────────────────────

_VISION_PROMPT = """
Read this exam page carefully.

Extract every visible question and options exactly as written.

IMPORTANT:
- Preserve maths exactly
- Preserve matrices exactly
- Preserve fractions exactly
- Preserve trigonometry exactly
- Preserve limits exactly
- Preserve equations exactly

Return valid JSON ONLY.

FORMAT:

[
  {
    "number": 1,
    "subject": "math",
    "question": "Find determinant of [[1,2],[3,4]]",
    "options": [
      "A) 1",
      "B) -2",
      "C) 4",
      "D) 0"
    ],
    "type": "mcq"
  }
]

If unsure, still return best possible JSON.

Never return explanation.
Never return markdown.
"""


# ─────────────────────────────────────────────
# GEMINI CLIENT
# ─────────────────────────────────────────────

def _gemini_client(api_key: str):

    from google import genai

    return genai.Client(
        api_key=api_key
    )


# ─────────────────────────────────────────────
# CLEAN JSON
# ─────────────────────────────────────────────

def _clean_json(raw: str) -> str:

    raw = re.sub(
        r"^```(?:json)?\s*",
        "",
        raw
    )

    raw = re.sub(
        r"\s*```$",
        "",
        raw
    )

    return raw.strip()


# ─────────────────────────────────────────────
# GEMINI OCR CALL
# ─────────────────────────────────────────────

def _gemini_vision_call(
    client,
    pil_img,
    prompt: str
):

    from google.genai import types

    buf = io.BytesIO()

    pil_img.save(
        buf,
        format="JPEG",
        quality=95
    )

    buf.seek(0)

    response = client.models.generate_content(

        model=GEMINI_MODEL,

        contents=[

            prompt,

            types.Part.from_bytes(
                data=buf.getvalue(),
                mime_type="image/jpeg"
            ),
        ],

        config={
            "temperature": 0,
            "max_output_tokens": 8192,
        }
    )

    try:

        return response.text.strip()

    except Exception:

        pass

    # fallback extraction
    try:

        candidates = response.candidates

        if candidates:

            text = ""

            for part in candidates[0].content.parts:

                if hasattr(part, "text"):

                    text += part.text

            return text.strip()

    except Exception as e:

        print("Gemini fallback error:", e)

    return ""


# ─────────────────────────────────────────────
# MAIN PARSER
# ─────────────────────────────────────────────

def parse_pdf(
    pdf_path: str,
    answer_key_page: str = "last",
    force_vision: bool = True,
    api_key: Optional[str] = None,
) -> List[Dict]:

    print()
    print("=" * 60)
    print("[Parser] GEMINI PDF PARSER")
    print("=" * 60)

    return _run_vision(
        pdf_path,
        answer_key_page,
        api_key
    )


# ─────────────────────────────────────────────
# RUN OCR
# ─────────────────────────────────────────────

def _run_vision(
    pdf_path: str,
    answer_key_page: str,
    api_key: Optional[str]
) -> List[Dict]:

    resolved_key = (
        api_key
        or os.environ.get("GEMINI_API_KEY", "")
    )

    if not resolved_key:

        raise ValueError(
            "Missing GEMINI_API_KEY"
        )

    client = _gemini_client(
        resolved_key
    )

    # PDF → image
    images = convert_from_path(
        pdf_path,
        dpi=DPI,
        fmt="jpeg",
        poppler_path="/opt/homebrew/bin"
    )

    total_pages = len(images)

    print(
        f"[Parser] Rendered {total_pages} pages"
    )

    if total_pages == 0:

        return []

    # save debug image
    images[0].save("debug_page_1.jpg")

    # ─────────────────────────────────────────
    # PAGE SPLIT
    # ─────────────────────────────────────────

    if total_pages == 1:

        question_pages = images
        answer_key_page_img = None

    elif answer_key_page == "last":

        question_pages = images[:-1]
        answer_key_page_img = images[-1]

    elif answer_key_page == "first":

        question_pages = images[1:]
        answer_key_page_img = images[0]

    else:

        question_pages = images
        answer_key_page_img = None

    # ─────────────────────────────────────────
    # ANSWER KEY
    # ─────────────────────────────────────────

    answer_key = {}

    if answer_key_page_img is not None:

        try:

            raw = _gemini_vision_call(
                client,
                answer_key_page_img,
                """
Extract answer key.

Return ONLY JSON object.

Example:
{
  "1":"A",
  "2":"C"
}
"""
            )

            raw = _clean_json(raw)

            if raw:

                answer_key = json.loads(raw)

            print(
                f"[Parser] Answer key entries: {len(answer_key)}"
            )

        except Exception as e:

            print(
                f"[Parser] Answer key failed: {e}"
            )

    # ─────────────────────────────────────────
    # QUESTION EXTRACTION
    # ─────────────────────────────────────────

    all_questions = []

    for index, image in enumerate(question_pages):

        page_no = index + 1

        print()
        print(f"[Parser] PAGE {page_no}")

        try:

            raw = _gemini_vision_call(
                client,
                image,
                _VISION_PROMPT
            )

            print()
            print("===== RAW GEMINI OUTPUT =====")
            print(raw[:3000])
            print("=============================")

            raw = _clean_json(raw)

            if not raw:

                print(
                    f"[Parser] Empty response page {page_no}"
                )

                continue

            # try direct JSON
            try:

                data = json.loads(raw)

            except Exception:

                # regex fallback
                match = re.search(
                    r"\[.*\]",
                    raw,
                    re.DOTALL
                )

                if not match:

                    print(
                        f"[Parser] JSON not found page {page_no}"
                    )

                    continue

                data = json.loads(
                    match.group(0)
                )

            if not isinstance(data, list):

                print(
                    f"[Parser] Invalid list page {page_no}"
                )

                continue

            page_questions = []

            for q in data:

                if not isinstance(q, dict):
                    continue

                question_text = str(
                    q.get("question", "")
                ).strip()

                if not question_text:
                    continue

                question = {

                    "number": q.get(
                        "number",
                        page_no
                    ),

                    "subject": str(
                        q.get(
                            "subject",
                            "math"
                        )
                    ).lower(),

                    "question": question_text,

                    "options": q.get(
                        "options",
                        []
                    ),

                    "type": str(
                        q.get(
                            "type",
                            "mcq"
                        )
                    ).lower(),

                    "answer": "",
                }

                page_questions.append(
                    question
                )

            print(
                f"[Parser] Extracted {len(page_questions)} questions"
            )

            all_questions.extend(
                page_questions
            )

        except Exception as e:

            print(
                f"[Parser] Page {page_no} failed:"
            )

            print(str(e))

    # ─────────────────────────────────────────
    # MERGE ANSWERS
    # ─────────────────────────────────────────

    for q in all_questions:

        q_num = str(q["number"])

        if q_num in answer_key:

            q["answer"] = answer_key[q_num]

    # ─────────────────────────────────────────
    # REMOVE DUPLICATES
    # ─────────────────────────────────────────

    dedup = {}

    for q in all_questions:

        key = str(q["number"])

        if (
            key not in dedup
            or len(q["question"])
            > len(dedup[key]["question"])
        ):

            dedup[key] = q

    final_questions = [

        dedup[key]

        for key in sorted(
            dedup,
            key=lambda x:
            int(x)
            if str(x).isdigit()
            else 999999
        )
    ]

    # ─────────────────────────────────────────
    # SUMMARY
    # ─────────────────────────────────────────

    print()
    print("=" * 60)

    print(
        f"[Parser] TOTAL QUESTIONS: "
        f"{len(final_questions)}"
    )

    subjects = {}

    for q in final_questions:

        subject = q.get(
            "subject",
            "unknown"
        )

        subjects[subject] = (
            subjects.get(subject, 0) + 1
        )

    print(
        f"[Parser] SUBJECTS: {subjects}"
    )

    answered = sum(
        1
        for q in final_questions
        if q.get("answer")
    )

    print(
        f"[Parser] ANSWERS: "
        f"{answered}/{len(final_questions)}"
    )

    print("=" * 60)

    return final_questions