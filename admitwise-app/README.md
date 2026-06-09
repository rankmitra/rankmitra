# AdmitWise — JoSAA Counselling Platform

Phase 1 MVP. Built on official JoSAA data (2019–2025).

## Project Structure

```
admitwise-app/
├── public/
│   └── data/
│       ├── cutoffs_final_compact.json   # Final-round rows (~72K) — fast startup
│       ├── cutoffs_all_compact.json     # All rounds (~420K) — loaded on demand
│       └── meta.json                   # Dropdown values, descriptions, mappings
├── src/
│   ├── components/
│   │   ├── ui/index.jsx                # Shared UI primitives
│   │   ├── predictor/
│   │   │   ├── PredictorForm.jsx       # Rank/category/quota input
│   │   │   └── PredictorResults.jsx    # Safe/Match/Reach results table
│   │   └── explorer/
│   │       └── Explorer.jsx            # Cutoff lookup by institute/branch
│   ├── hooks/
│   │   └── useData.js                  # Async data loading hooks
│   ├── utils/
│   │   ├── dataLoader.js               # Fetch + inflate columnar JSON
│   │   └── filters.js                  # Pure filtering & classification logic
│   ├── App.jsx                         # Root, mode switcher, layout
│   └── main.jsx
└── data/                               # Source data (not deployed)
    ├── raw/                            # Original CSV
    ├── processed/                      # Generated JSON files
    └── scripts/
        └── preprocess.py               # Run this to regenerate data files

## Getting Started

npm install
npm run dev       # Development server

## Data Pipeline

When you receive updated JoSAA data:
1. Replace data/raw/RankMitra_Master_Cutoffs.csv
2. Run: python3 data/scripts/preprocess.py
3. Copy the output files from data/processed/ to public/data/

## Deploy

npm run build
# Deploy the dist/ folder to Vercel, Netlify, or any static host

## Phase Roadmap

- ✅ Phase 1: College Predictor + Cutoff Explorer (this build)
- ⬜ Phase 2: Branch filter, PwD toggle, female-only toggle
- ⬜ Phase 3: Trend charts (rank over years)
- ⬜ Phase 4: Personalized PDF counselling report
- ⬜ Phase 5: Monetization (premium features)
