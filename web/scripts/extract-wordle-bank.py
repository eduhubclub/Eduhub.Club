#!/usr/bin/env python3
"""Extract Fry / Dolch / UFLI Wordle lists from PDFs into wordLists.js."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import fitz

DOWNLOADS = Path.home() / "Downloads"
OUT = (
    Path(__file__).resolve().parent.parent
    / "src"
    / "apps"
    / "games"
    / "wordle"
    / "wordLists.js"
)

SOURCES = [
    (
        "fry",
        "Fry 1000",
        "Fry high-frequency words (first 1,000).",
        DOWNLOADS / "fry_complete_1000.pdf",
    ),
    (
        "dolch",
        "Dolch",
        "Dolch sight words (pre-primer through third grade).",
        DOWNLOADS / "Dolch Words Slides.pdf",
    ),
    (
        "heart",
        "UFLI Heart Words",
        "UFLI irregular heart words.",
        DOWNLOADS / "UFLI Heart Words.pdf",
    ),
    (
        "irregular",
        "UFLI Irregular Words",
        "UFLI irregular words slides.",
        DOWNLOADS / "UFLI Irregular Words.pdf",
    ),
]

SKIP_LINE = re.compile(
    r"(copyright|k12reader|www\.|worksheet|free to duplicate|free for educational|"
    r"fry words|list\s+\d+|slides|irregular|heart.?words|dolch|"
    r"pre-?primer|^primer$|first grade|second grade|third grade|"
    r"nouns|verbs|adjectives|sight words)",
    re.I,
)


def normalize_word(s: str) -> str:
    s = unicodedata.normalize("NFKC", s).strip()
    s = (
        s.replace("ﬁ", "fi")
        .replace("ﬂ", "fl")
        .replace("ﬀ", "ff")
        .replace("ﬃ", "ffi")
        .replace("ﬄ", "ffl")
        .replace("’", "'")
        .replace("‘", "'")
    )
    return s


def extract_words(pdf_path: Path) -> list[str]:
    doc = fitz.open(pdf_path)
    words: list[str] = []
    for page in doc:
        for raw in page.get_text("text").splitlines():
            line = normalize_word(raw)
            if not line:
                continue
            if SKIP_LINE.search(line) and not re.fullmatch(r"[A-Za-z']+", line):
                continue
            if SKIP_LINE.fullmatch(line):
                continue
            if not re.fullmatch(r"[A-Za-z']+", line):
                continue
            if "'" in line:
                continue
            clean = line.lower()
            if len(clean) < 2 or len(clean) > 8:
                continue
            if not re.fullmatch(r"[a-z]+", clean):
                continue
            words.append(clean)
    return sorted(set(words))


def main() -> None:
    lists = []
    for list_id, name, description, path in SOURCES:
        words = extract_words(path)
        lists.append(
            {
                "id": list_id,
                "name": name,
                "description": description,
                "words": words,
            }
        )
        print(f"{list_id}: {len(words)} words from {path.name}")

    lines = [
        "/** Classroom Wordle lists extracted from Fry, Dolch, and UFLI PDFs (2–8 letters, a–z only). */",
        "export const WORD_LISTS = [",
    ]
    for lst in lists:
        lines.append("  {")
        lines.append(f"    id: {json.dumps(lst['id'])},")
        lines.append(f"    name: {json.dumps(lst['name'])},")
        lines.append(f"    description: {json.dumps(lst['description'])},")
        words_js = ", ".join(json.dumps(w) for w in lst["words"])
        lines.append(f"    words: [{words_js}],")
        lines.append("  },")
    lines.append("];")
    lines.append("")
    lines.append("export const WORD_LIST_IDS = WORD_LISTS.map((list) => list.id);")
    lines.append("")
    OUT.write_text("\n".join(lines) + "\n")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
