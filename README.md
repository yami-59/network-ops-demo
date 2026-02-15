# Network Ops Demo — Fullstack (Next.js + Chakra UI + FastAPI)

Modern, minimal demo to replace email-based network operations requests:
- Create request (rule definition)
- List & filter requests
- Detail: status updates + mandatory comment + history (traceability)
- Planning view
- AI Assistant (LLM + DB context, anti-hallucination). Works in safe mode if no API key.

## Prerequisites
- Node.js 18+
- Python 3.10+

---

## 1) Backend (FastAPI)

### Setup
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### Run
```bash
uvicorn app.main:app --reload --port 8000
```

Backend: http://localhost:8000  
Docs: http://localhost:8000/docs

> If `OPENAI_API_KEY` is empty, `/assistant` runs in safe mode (no hallucinations).

---

## 2) Frontend (Next.js + Chakra UI)

### Setup
```bash
cd frontend
npm install
cp .env.example .env.local
```

### Run
```bash
npm run dev
```

Frontend: http://localhost:3000

---

## Notes
- DB: SQLite file at `backend/data/app.db`
- No auth (demo): department is selected manually when updating status.
- Status transitions are controlled:
  - PENDING → PLANNED
  - PLANNED → EXECUTED / FAILED
  - FAILED → PLANNED
