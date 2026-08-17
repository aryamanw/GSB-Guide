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

def parse_survival_guide():
    filepath = os.path.join(MD_DIR, 'gsb-guide-gemini.md')
    if not os.path.exists(filepath):
        filepath = os.path.join(MD_DIR, 'GSB Survival Guide.md')

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = clean_text(content)
    
    # Split content into sections based on headings
    lines = content.split('\n')
    
    parts = []
    current_part = {
        "id": "intro",
        "title": "Introduction & Overview",
        "chapters": []
    }

    current_chapter = {
        "id": "overview",
        "number": 0,
        "title": "Welcome & Overview",
        "subsections": []
    }

    current_subsection = {
        "id": "intro-overview",
        "title": "Overview",
        "content": []
    }

    def slugify(text):
        slug = re.sub(r'[^\w\s-]', '', text.lower())
        return re.sub(r'[-\s]+', '-', slug).strip('-')

    for line in lines:
        raw = line.strip()
        if not raw:
            if current_subsection["content"] and current_subsection["content"][-1] != "":
                current_subsection["content"].append("")
            continue

        if raw.startswith('# '):
            # Part header
            title = raw.lstrip('# ').strip()
            if current_subsection["content"]:
                current_chapter["subsections"].append(current_subsection)
                current_subsection = {"id": slugify(title), "title": title, "content": []}
            if current_chapter["subsections"]:
                current_part["chapters"].append(current_chapter)
                current_chapter = {"id": slugify(title), "number": 0, "title": title, "subsections": []}
            if current_part["chapters"]:
                parts.append(current_part)
                current_part = {"id": slugify(title), "title": title, "chapters": []}
            current_part["title"] = title
            current_part["id"] = slugify(title)

        elif raw.startswith('## '):
            title = raw.lstrip('## ').strip()
            if current_subsection["content"]:
                current_chapter["subsections"].append(current_subsection)
            if current_chapter["subsections"]:
                current_part["chapters"].append(current_chapter)
            
            chap_id = slugify(title)
            current_chapter = {
                "id": chap_id,
                "number": 0,
                "title": title,
                "subsections": []
            }
            current_subsection = {"id": chap_id + "-intro", "title": title, "content": []}

        elif raw.startswith('### '):
            title = raw.lstrip('### ').strip()
            if current_subsection["content"]:
                current_chapter["subsections"].append(current_subsection)
            
            # Check for chapter number pattern like "1. Packing and Shipping" or "Chapter 1: ..."
            match_num = re.match(r'^(\d+)\.\s*(.*)', title)
            chap_num = int(match_num.group(1)) if match_num else 0
            
            sub_id = slugify(title)
            if chap_num > 0:
                if current_chapter["subsections"]:
                    current_part["chapters"].append(current_chapter)
                current_chapter = {
                    "id": sub_id,
                    "number": chap_num,
                    "title": title,
                    "subsections": []
                }
                current_subsection = {"id": sub_id + "-main", "title": title, "content": []}
            else:
                current_subsection = {"id": sub_id, "title": title, "content": []}

        elif raw.startswith('#### '):
            title = raw.lstrip('#### ').strip()
            if current_subsection["content"]:
                current_chapter["subsections"].append(current_subsection)
            current_subsection = {"id": slugify(title), "title": title, "content": []}

        else:
            current_subsection["content"].append(raw)

    # Flush last section
    if current_subsection["content"]:
        current_chapter["subsections"].append(current_subsection)
    if current_chapter["subsections"]:
        current_part["chapters"].append(current_chapter)
    if current_part["chapters"]:
        parts.append(current_part)

    # Post-process parts & chapters to clean content lists into clean paragraphs / markdown strings
    for p in parts:
        for c in p["chapters"]:
            for s in c["subsections"]:
                s["body"] = "\n".join(s["content"]).strip()
                del s["content"]

    return parts

def parse_international_guide():
    filepath = os.path.join(MD_DIR, 'International Students Guide.md')
    if not os.path.exists(filepath):
        return []

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = clean_text(content)
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
        block = app_d.group(1)
        matches = re.findall(r'-\s*\*\*([^\*]+)\*\*:\s*(.*?)(?=\n-\s*\*|\Z)', block, re.DOTALL)
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
        block = app_e.group(1)
        matches = re.findall(r'-\s*\*([^\*]+)\*\s*(.*?)(?=\n-\s*\*|\Z)', block, re.DOTALL)
        for question, answer in matches:
            faqs.append({
                "question": clean_text(question.strip()),
                "answer": clean_text(answer.replace('\n', ' ').strip())
            })
    return faqs

def parse_checklists():
    filepath = os.path.join(MD_DIR, 'gsb-guide-gemini.md')
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    chap_7 = re.search(r'### 7\. The Before-You-Arrive Checklist(.*?)(# Part II|\Z)', content, re.DOTALL)
    items = []
    if chap_7:
        block = chap_7.group(1)
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
    print("Parsing Survival Guide...")
    survival = parse_survival_guide()
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
