import os
import re
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD_DIR = os.path.join(BASE_DIR, 'md-files')
DATA_DIR = os.path.join(BASE_DIR, 'src', 'data')

os.makedirs(DATA_DIR, exist_ok=True)

def clean_text(text):
    if not text:
        return ""
    # Remove citations like [cite: 1]
    text = re.sub(r'\[cite:\s*\d+\]', '', text)
    return text.strip()

def slugify(text):
    slug = re.sub(r'[^\w\s-]', '', text.lower())
    return re.sub(r'[-\s]+', '-', slug).strip('-')


# ---------------------------------------------------------------------------
# Full-text Survival Guide parser
#
# md-files/gsb-guide-gemini.md is a hand-condensed ~9.5k-word retelling of the
# guide (used below for the Dictionary/FAQ/Checklist appendices, which are
# already cleanly structured there). The Survival Guide *reader*, however,
# should carry the complete ~50k-word guide, so it's parsed straight from the
# raw PDF-text extraction in "GSB Survival Guide.md" instead.
#
# That raw file has PDF-extraction quirks this parser cleans up:
#   - every chapter/section opens with a nav banner line like "← S →3. Housing"
#     (arrows + "S" = prev/contents/next); these double as reliable section
#     boundaries.
#   - running page headers/footers repeat the section title in caps
#     ("3. HOUSING") throughout the body and need stripping.
#   - inline image URLs (Google-hosted banner images) litter the text.
#   - PDF line-wrap hyphenation splits words across lines ("attach-ments").
# ---------------------------------------------------------------------------

DICT_WORDS_PATH = '/usr/share/dict/words'

def _load_dictionary_words():
    try:
        with open(DICT_WORDS_PATH, encoding='utf-8') as f:
            return set(w.strip().lower() for w in f if w.strip())
    except OSError:
        return set()

_DICT_WORDS = _load_dictionary_words()

# Populated per-document by build_corpus_wordset() before parsing: proper
# nouns like "Stanford" or "Munger" get split by the same line-wrap
# hyphenation but aren't in a general-purpose word list. Since they appear
# whole, unbroken, elsewhere in the same guide, harvesting real words the
# document itself uses covers them without hardcoding names.
_EXTRA_WORDS = set()

def build_corpus_wordset(lines):
    words = set()
    for line in lines:
        s = line.strip()
        if not s or IMAGE_LINE_RE.match(s) or ORPHAN_NUMBER_RE.match(s) or is_footerish(s):
            continue
        # words not touching a hyphen on either side, so split fragments
        # ("Stan-ford" -> "Stan", "ford") never pollute the corpus
        for tok in re.findall(r'(?<![A-Za-z-])[A-Za-z]{3,}(?![A-Za-z-])', s):
            words.add(tok.lower())
    return words

def _is_dictionary_word(word):
    """True if `word` (or its likely uninflected stem) is a real word.
    The system word list skips most plurals/inflections, so a handful of
    common suffixes are also tried before giving up."""
    w = word.lower()
    known = w in _DICT_WORDS or w in _EXTRA_WORDS
    if known:
        return True
    if w.endswith('s') and (w[:-1] in _DICT_WORDS or w[:-1] in _EXTRA_WORDS):
        return True
    if w.endswith('es') and (w[:-2] in _DICT_WORDS or w[:-2] in _EXTRA_WORDS):
        return True
    if w.endswith('ed') and (w[:-2] in _DICT_WORDS or w[:-2] in _EXTRA_WORDS):
        return True
    if w.endswith('ing') and (w[:-3] in _DICT_WORDS or w[:-3] + 'e' in _DICT_WORDS
                               or w[:-3] in _EXTRA_WORDS or w[:-3] + 'e' in _EXTRA_WORDS):
        return True
    return False


def dehyphenate(text):
    """Rejoin words that PDF line-wrapping split with a hyphen (e.g.
    'attach-ments' -> 'attachments'), while leaving real hyphenated
    compounds (e.g. 'off-campus') alone. Uses the system word list to tell
    the two apart: only merge when the joined form is a real word."""
    if not _DICT_WORDS:
        return text

    def repl(m):
        a, b = m.group(1), m.group(2)
        if _is_dictionary_word(a + b):
            return a + b
        return m.group(0)

    return re.sub(r'\b([A-Za-z]{2,})-([a-z]{2,})\b', repl, text)


IMAGE_LINE_RE = re.compile(r'^https?://\S+$')
ORPHAN_NUMBER_RE = re.compile(r'^\d+\.$')
BOUNDARY_RE = re.compile(r'^(←)?\s*S\s*(→)?\s*(?=[A-Z0-9])(.+)$')


def is_footerish(line):
    """Running headers/footers in the raw text are short all-caps lines
    (page headers repeating the section title, or letter-spaced banners
    like "P A R T I I")."""
    s = line.strip()
    if not s or len(s) > 70:
        return False
    letters = re.sub(r'[^A-Za-z]', '', s)
    if len(letters) < 3:
        return False
    return letters.isupper()


def looks_like_subheading(line, chapter_title):
    s = line.strip()
    if not s or len(s) > 70:
        return False
    if s[-1] in '.!?;:,':
        return False
    if s.startswith(('—', '-', '•', 'http')):
        return False
    if not s[0].isupper():
        return False
    words = s.split()
    if not (1 <= len(words) <= 9):
        return False
    if s.lower().rstrip('.') == re.sub(r'^\d+\.\s*', '', chapter_title).lower():
        return False
    return True


def find_chapter_boundaries(lines):
    """Returns [(line_index, title), ...] for every chapter/section nav
    banner in the raw guide, in document order."""
    boundaries = []
    for i, line in enumerate(lines):
        m = BOUNDARY_RE.match(line.strip())
        if m and (m.group(1) or m.group(2)):
            boundaries.append((i, m.group(3).strip()))
    return boundaries


def merge_line_end_hyphens(lines):
    """The raw text wraps mid-word at the end of a physical line
    ('conversa-' / 'tions'), unlike the same-line hyphenation
    dehyphenate() handles. Stitch those back into one line, dropping the
    hyphen when the joined word is real (matching dehyphenate()'s logic)
    and keeping it when the line just happens to end on a genuine
    hyphenated compound."""
    out = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        while line[-1:] == '-' and line[-2:-1].isalpha() and i + 1 < n and lines[i + 1]:
            nxt = lines[i + 1]
            m = re.match(r'^([A-Za-z]+)', nxt)
            if not m:
                break
            first_word = m.group(1)
            rest = nxt[len(first_word):]
            stem_match = re.search(r'([A-Za-z]+)-$', line)
            prefix = line[:stem_match.start()]
            stem = stem_match.group(1)
            joined = stem + first_word
            if _is_dictionary_word(joined):
                line = prefix + joined + rest
            else:
                line = prefix + stem + '-' + first_word + rest
            i += 1
        out.append(line)
        i += 1
    return out


def clean_body_lines(raw_lines, chapter_title):
    """Strip image URLs, running headers/footers, and orphaned list-marker
    lines from a chapter's raw line range; return cleaned lines."""
    cleaned = []
    for line in raw_lines:
        s = line.strip()
        if not s:
            cleaned.append('')
            continue
        if IMAGE_LINE_RE.match(s):
            continue
        if ORPHAN_NUMBER_RE.match(s):
            continue
        if is_footerish(s):
            continue
        cleaned.append(s)
    return merge_line_end_hyphens(cleaned)


def build_subsections(cleaned_lines, chapter_title, base_id):
    """Split a chapter's cleaned lines into subsections at heading-like
    standalone lines, joining the rest into paragraph text.

    Dense reference tables (contact lists, event tables) extract as runs of
    consecutive short, punctuation-free lines that each look like a heading
    in isolation. Promoting every one of them would flush() a heading
    immediately followed by another heading — i.e. zero accumulated body —
    which used to silently drop that line's text entirely. To avoid losing
    content, a line is only promoted to a heading when the next non-blank
    line is *not* itself heading-shaped; a run of heading-shaped lines
    collapses into ordinary body text instead, and as a last-resort safety
    net flush() falls back to keeping an orphaned title as its own body
    rather than discarding it."""
    subsections = []
    current_title = None
    current_lines = []

    def flush():
        if not current_lines and current_title is None:
            return
        body = '\n'.join(current_lines).strip()
        # collapse 3+ blank lines down to a single paragraph break
        body = re.sub(r'\n{3,}', '\n\n', body)
        title = current_title or chapter_title
        if not body:
            if not current_title:
                return
            body = current_title  # never silently drop an orphaned heading
        sub_id = slugify(f"{base_id}-{title}") if current_title else f"{base_id}-main"
        subsections.append({"id": sub_id, "title": title, "body": dehyphenate(body)})

    n = len(cleaned_lines)
    for i, line in enumerate(cleaned_lines):
        if line == '':
            if current_lines and current_lines[-1] != '':
                current_lines.append('')
            continue

        next_line = next((cleaned_lines[j] for j in range(i + 1, n) if cleaned_lines[j] != ''), None)
        next_is_heading = next_line is not None and looks_like_subheading(next_line, chapter_title)

        if looks_like_subheading(line, chapter_title) and not next_is_heading:
            flush()
            current_title = line.strip()
            current_lines = []
        else:
            current_lines.append(line)

    flush()

    if not subsections:
        subsections.append({
            "id": f"{base_id}-main",
            "title": chapter_title,
            "body": ""
        })

    return subsections


def parse_survival_guide_full():
    filepath = os.path.join(MD_DIR, 'GSB Survival Guide.md')
    if not os.path.exists(filepath):
        return []

    with open(filepath, 'r', encoding='utf-8') as f:
        raw_lines = [l.rstrip('\n') for l in f]

    global _EXTRA_WORDS
    _EXTRA_WORDS = build_corpus_wordset(raw_lines)

    boundaries = find_chapter_boundaries(raw_lines)
    if not boundaries:
        return []

    # Group chapters into parts by title. Order and grouping mirror the
    # guide's own table of contents.
    part_defs = [
        ("front-matter", "Front Matter", {
            "How to Use This Guide", "Acknowledgments",
            "A Note from the Guide Creator",
            "A Brief History of the Farm (and the GSB)"
        }),
        ("part-i", "Part I — Before You Arrive", None),   # chapters 1-7
        ("part-ii", "Part II — Life at the GSB", None),   # chapters 8-26
        ("part-iii", "Part III — Exiting the GSB", None), # chapters 27-29
        ("closing-appendices", "Closing & Appendices", {
            "A Closing Note: On Contribution",
            "Appendix A — The Resources Folder",
            "Appendix B — Quick-Reference Numbers and Links",
            "Appendix C — The Official-Links Directory",
            "Appendix D — The GSB Dictionary",
            "Appendix E — Quick Answers: The Class-Chat FAQ",
            "Appendix F — Primary Sources",
        }),
    ]

    # Chapters whose full text is better served by the site's dedicated,
    # purpose-built tabs (Dictionary / FAQ) rather than duplicated here as
    # dense raw prose.
    POINTER_OVERRIDES = {
        "Appendix D — The GSB Dictionary":
            "The full glossary lives in the Dictionary tab above — head there "
            "for definitions of every GSB term, acronym, and tradition "
            "mentioned throughout this guide.",
        "Appendix E — Quick Answers: The Class-Chat FAQ":
            "This appendix's full Q&A archive lives in the searchable FAQ tab "
            "above — head there for fast answers on living, food, tech, "
            "academics, careers, transport, and health questions.",
    }

    chapters_all = []
    for idx, (start, title) in enumerate(boundaries):
        end = boundaries[idx + 1][0] if idx + 1 < len(boundaries) else len(raw_lines)
        body_lines = raw_lines[start + 1:end]
        chapters_all.append((title, body_lines))

    parts = []
    for part_id, part_title, title_set in part_defs:
        part = {"id": part_id, "title": part_title, "chapters": []}

        for title, body_lines in chapters_all:
            match_num = re.match(r'^(\d+)\.\s*(.*)', title)
            chap_num = int(match_num.group(1)) if match_num else 0

            if title_set is not None:
                belongs = title in title_set
            elif part_id == "part-i":
                belongs = 1 <= chap_num <= 7
            elif part_id == "part-ii":
                belongs = 8 <= chap_num <= 26
            elif part_id == "part-iii":
                belongs = 27 <= chap_num <= 29
            else:
                belongs = False

            if not belongs:
                continue

            chap_id = slugify(title)

            if title in POINTER_OVERRIDES:
                subsections = [{
                    "id": f"{chap_id}-main",
                    "title": title,
                    "body": POINTER_OVERRIDES[title]
                }]
            else:
                cleaned = clean_body_lines(body_lines, title)
                subsections = build_subsections(cleaned, title, chap_id)

            part["chapters"].append({
                "id": chap_id,
                "number": chap_num,
                "title": title,
                "subsections": subsections
            })

        if part["chapters"]:
            parts.append(part)

    return parts


def parse_international_guide():
    filepath = os.path.join(MD_DIR, 'International Students Guide.md')
    if not os.path.exists(filepath):
        return []

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = clean_text(content)

    # Drop the "Table of Contents" block: its dotted/numbered entries
    # ("1. Packing and Shipping 7 2. Preparing for Arrival 8") match the
    # same heading pattern used below and would otherwise leak in as a
    # couple of junk sections ahead of the real "Part I – Welcome!" opener.
    toc_match = re.search(r'^Table of Contents\s*$', content, re.MULTILINE)
    real_start = re.search(r'^Part I – Welcome!\s*$', content, re.MULTILINE)
    if toc_match and real_start and real_start.start() > toc_match.start():
        content = content[:toc_match.start()] + content[real_start.start():]

    lines = content.split('\n')

    sections = []
    current_sec = {"id": "welcome", "title": "Welcome & Overview", "lines": []}

    for line in lines:
        raw = line.strip()
        if not raw:
            current_sec["lines"].append("")
            continue

        # Check for headings like "Part I...", "1. ...", "2.1 ..."
        is_heading = False
        if raw.startswith('Part ') or re.match(r'^\d+(\.\d+)?\s+[A-Z]', raw):
            is_heading = True

        if is_heading and len(raw) < 100:
            if current_sec["lines"]:
                current_sec["body"] = "\n".join(current_sec["lines"]).strip()
                del current_sec["lines"]
                sections.append(current_sec)

            slug = re.sub(r'[^\w\s-]', '', raw.lower())
            slug = re.sub(r'[-\s]+', '-', slug).strip('-')
            current_sec = {"id": slug, "title": raw, "lines": []}
        else:
            current_sec["lines"].append(raw)

    if current_sec.get("lines"):
        current_sec["body"] = "\n".join(current_sec["lines"]).strip()
        del current_sec["lines"]
        sections.append(current_sec)

    return sections

def parse_dictionary():
    filepath = os.path.join(MD_DIR, 'gsb-guide-gemini.md')
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    app_d = re.search(r'### Appendix D — The GSB Dictionary(.*?)(### Appendix E|\Z)', content, re.DOTALL)
    terms = []
    if app_d:
        # Drop the trailing "---" section divider so it doesn't get
        # swallowed into the last entry's definition.
        block = re.sub(r'\n-{3,}\s*\Z', '', app_d.group(1))
        # Entries are "- **Term:** definition" — the colon sits *inside*
        # the closing bold marker, not after it.
        matches = re.findall(r'-\s*\*\*([^\*:]+):\*\*\s*(.*?)(?=\n-\s*\*\*|\Z)', block, re.DOTALL)
        for term, definition in matches:
            clean_def = clean_text(definition.replace('\n', ' '))
            terms.append({
                "term": term.strip(),
                "definition": clean_def
            })

    # Fallback default terms if regex missed any
    if not terms:
        terms = [
            {"term": "Arbuckle", "definition": "The main dining café located in Knight Management Center (KMC)."},
            {"term": "Blast", "definition": "The class-wide mass email system for announcements."},
            {"term": "C4C", "definition": "Challenge 4 Charity - sports and fundraising competition between West Coast business schools."},
            {"term": "FOAM", "definition": "Friends of Andrew Mellor - iconic Tuesday night GSB party tradition."},
            {"term": "GND", "definition": "Grade Non-Disclosure policy maintained by students."},
            {"term": "GST", "definition": "Global Study Trip - overseas immersive business trip."},
            {"term": "JMac", "definition": "Jack McDonald Hall - student housing residence."},
            {"term": "KMC", "definition": "Knight Management Center - the GSB campus complex."},
            {"term": "LPF", "definition": "Late Performance Fee - Friday afternoon social/happy hour tradition."},
            {"term": "Schwab", "definition": "Schwab Residential Center - primary MBA1 housing residence."},
            {"term": "TALK", "definition": "Weekly student intimate storytelling tradition every intimate Tuesday evening."},
            {"term": "Touchy Feely", "definition": "Interpersonal Dynamics - the famous core elective course at Stanford GSB."}
        ]

    return terms

def parse_faqs():
    filepath = os.path.join(MD_DIR, 'gsb-guide-gemini.md')
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    app_e = re.search(r'### Appendix E — Quick Answers: The Class-Chat FAQ(.*?)(### Appendix F|\Z)', content, re.DOTALL)
    faqs = []
    if app_e:
        # Drop the trailing "---" section divider so it doesn't get
        # swallowed into the last entry's answer.
        block = re.sub(r'\n-{3,}\s*\Z', '', app_e.group(1))
        # The block is split into "#### Category" groups; fall back to a
        # single uncategorized group if none are present.
        groups = re.split(r'\n#### (.+)\n', block)
        if len(groups) == 1:
            groups = [None, "General", groups[0]]
        # re.split with a capturing group yields [preamble, cat1, body1, cat2, body2, ...]
        for i in range(1, len(groups), 2):
            category = groups[i].strip()
            body = groups[i + 1]
            matches = re.findall(r'-\s*\*([^\*]+)\*\s*(.*?)(?=\n-\s*\*|\Z)', body, re.DOTALL)
            for question, answer in matches:
                faqs.append({
                    "question": clean_text(question.strip()),
                    "answer": clean_text(answer.replace('\n', ' ').strip()),
                    "category": category
                })
    return faqs

def parse_checklists():
    filepath = os.path.join(MD_DIR, 'gsb-guide-gemini.md')
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    chap_7 = re.search(r'### 7\. The Before-You-Arrive Checklist(.*?)(# Part II|\Z)', content, re.DOTALL)
    items = []
    if chap_7:
        # Drop the trailing "---" section divider so it doesn't get
        # swallowed into the last item's task text.
        block = re.sub(r'\n-{3,}\s*\Z', '', chap_7.group(1))
        matches = re.findall(r'(\d+)\.\s*(.*?)(?=\n\d+\.|\Z)', block, re.DOTALL)
        for num, text in matches:
            items.append({
                "id": f"chk-{num}",
                "category": "Before You Arrive",
                "task": clean_text(text.replace('\n', ' ').strip()),
                "defaultChecked": False
            })

    # Add international student specific checklist items
    intl_items = [
        {"id": "chk-intl-1", "category": "International Prep", "task": "Obtain F-1 / J-1 Visa stamp and verify I-20 / DS-2019 details", "defaultChecked": False},
        {"id": "chk-intl-2", "category": "International Prep", "task": "Check US entry regulations & customs requirements for international travel", "defaultChecked": False},
        {"id": "chk-intl-3", "category": "International Prep", "task": "Apply for Social Security Number (SSN) after arriving and securing eligible campus job/CPT", "defaultChecked": False},
        {"id": "chk-intl-4", "category": "International Prep", "task": "Prepare tax documents (Form 8843) for Bechtel International Center compliance", "defaultChecked": False},
        {"id": "chk-intl-5", "category": "International Prep", "task": "Open US Bank Account (Bank of America / Chase / Wells Fargo near campus)", "defaultChecked": False},
        {"id": "chk-intl-6", "category": "International Prep", "task": "Get US eSIM / SIM Card (Mint Mobile / AT&T / T-Mobile)", "defaultChecked": False}
    ]

    return items + intl_items

if __name__ == '__main__':
    print("Parsing Survival Guide (full text)...")
    survival = parse_survival_guide_full()
    with open(os.path.join(DATA_DIR, 'survivalGuideData.json'), 'w', encoding='utf-8') as f:
        json.dump(survival, f, indent=2)

    print("Parsing International Guide...")
    intl = parse_international_guide()
    with open(os.path.join(DATA_DIR, 'internationalGuideData.json'), 'w', encoding='utf-8') as f:
        json.dump(intl, f, indent=2)

    print("Parsing Dictionary...")
    dict_data = parse_dictionary()
    with open(os.path.join(DATA_DIR, 'dictionaryData.json'), 'w', encoding='utf-8') as f:
        json.dump(dict_data, f, indent=2)

    print("Parsing FAQs...")
    faqs = parse_faqs()
    with open(os.path.join(DATA_DIR, 'faqData.json'), 'w', encoding='utf-8') as f:
        json.dump(faqs, f, indent=2)

    print("Parsing Checklists...")
    checklists = parse_checklists()
    with open(os.path.join(DATA_DIR, 'checklistData.json'), 'w', encoding='utf-8') as f:
        json.dump(checklists, f, indent=2)

    print("Data parsing complete! Files generated in src/data/")
