# 🧠 MindCare AI

**MindCare AI** is a unified prototype for therapist discovery + multi‑AI therapist chat with a wellness coach.

## Modules
- **Therapist Finder** (search, filters, detail view)
- **Multi‑AI Chat** (3 therapist personas + user)
- **Wellness Coach** (breathing/stress‑relief cards)
- **Favorites** (bookmark therapists)
- **Crisis Detector** (safety keywords → helplines)

## Stack
- Frontend: React + Vite + TailwindCSS + Framer Motion (Vercel-ready)
- Backend: FastAPI (Python) + Supabase client (Railway/Fly.io)
- DB: Supabase Postgres (therapists, users, chat logs)
- AI: OpenAI GPT (or OSS models) for persona responses

## Quickstart

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env   # then fill in keys
uvicorn app.main:app --reload
# visit http://127.0.0.1:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# visit http://127.0.0.1:5173
```

## Environment
Create `.env` at repo root:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

## Docs
See `docs/architecture.puml` for the full system diagram.
