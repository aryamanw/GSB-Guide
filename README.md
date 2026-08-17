# Stanford GSB Unofficial Survival Guide — Interactive Hub

An interactive web application built from the Stanford GSB Unofficial Survival Guide, International Student Handbook, and class knowledge. Designed for incoming MBA students.

## ✨ Features

| Feature | Description |
|---|---|
| 📚 **Survival Guide** | All 29 chapters in an interactive reading view with bookmarks |
| 🌍 **International Guide** | Visas, SSN, CPT, US banking, driver's license, tax (Form 8843) |
| ✅ **Pre-Arrival Checklist** | Interactive task list saved in your browser (localStorage) |
| 📖 **GSB Dictionary** | 28+ terms, acronyms, and traditions decoded |
| 🏠 **Housing Explorer** | Compare Schwab, JMac, EV, and off-campus neighborhoods |
| ❓ **Class FAQs** | 19+ common questions answered (Cardinal Care, cars, pets, MARRS...) |
| 🔍 **Global Search** | Fuzzy search across all guides, dictionary, and FAQs (`Cmd+K`) |
| 🌙 **Dark/Light Mode** | Persisted theme preference |
| 🔖 **Bookmarks** | Save chapters for quick reference |

---

## 🚀 Hosting on GitHub Pages

### Option A: Automatic (Recommended)

The repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys every time you push to `main`.

1. Push this project to a GitHub repository
2. Go to **Settings → Pages**
3. Set **Source** to: `GitHub Actions`
4. Push to `main` — the site will be live at `https://<your-username>.github.io/<repo-name>/`

### Option B: Manual (from `dist/` folder)

```bash
# Build the site
npm run build

# The dist/ folder contains all static files ready for any static host
```

You can deploy the `dist/` folder to:
- GitHub Pages (via `gh-pages` branch)
- Netlify (drag-and-drop)
- Vercel (static deploy)
- Any web server

---

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Re-parse markdown files into JSON (run when md-files change)
npm run parse

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Project Structure

```
GSB-Guide/
├── md-files/                    # Source markdown documents
│   ├── gsb-guide-gemini.md     # Main GSB Survival Guide (structured)
│   └── International Students Guide.md
├── scripts/
│   └── parse_md.py             # Parses .md files → JSON data
├── src/
│   ├── data/                   # Auto-generated JSON data (from parse_md.py)
│   │   ├── survivalGuideData.json
│   │   ├── internationalGuideData.json
│   │   ├── dictionaryData.json
│   │   ├── faqData.json
│   │   └── checklistData.json
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── HeroLanding.jsx
│   │   ├── GuideReader.jsx
│   │   ├── ChecklistTracker.jsx
│   │   ├── DictionaryView.jsx
│   │   ├── FAQView.jsx
│   │   ├── HousingExplorer.jsx
│   │   └── GlobalSearchModal.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .github/workflows/deploy.yml  # GitHub Actions auto-deploy
├── tailwind.config.js
├── vite.config.js
└── index.html
```

---

## 📝 Updating Content

When the markdown source files change:

```bash
npm run parse    # Re-parse md-files → src/data/*.json
npm run build    # Rebuild the site
```

The `npm run build` command automatically runs `parse_md.py` before Vite builds.

---

## ⚠️ Disclaimer

This is an unofficial, student-made guide. It is not published, reviewed, or endorsed by Stanford University or the Graduate School of Business. Verify anything sensitive against official sources.

© 2026 Nikhil Jain. Shared freely with the GSB community for personal, non-commercial use.
