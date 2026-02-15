from __future__ import annotations
import os
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from .db import SessionLocal, engine
from .models import Base
from .schemas import RequestCreate, RequestOut, HistoryOut, RequestDetailOut, StatusUpdateIn, AssistantIn, AssistantOut
from .repo import create_request, list_requests, get_request, get_history, update_status, list_planning
from .constants import Status, Department, ALLOWED_TRANSITIONS
from .assistant import answer as assistant_answer

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Network Ops Demo API", version="1.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/requests", response_model=RequestOut)
def api_create_request(body: RequestCreate, db: Session = Depends(get_db)):
    op_id = create_request(db, body.model_dump())
    req = get_request(db, op_id)
    return _to_request_out(req)

@app.get("/requests", response_model=list[RequestOut])
def api_list_requests(
    status: str = Query("ALL"),
    q: str | None = Query(None),
    db: Session = Depends(get_db)
):
    items = list_requests(db, status=status, q=q)
    return [_to_request_out(r) for r in items]


@app.get("/requests/{op_id}", response_model=RequestDetailOut)
def api_get_request(op_id: str, db: Session = Depends(get_db)):
    req = get_request(db, op_id)
    if not req:
        raise HTTPException(404, "Not found")

    hist = get_history(db, op_id)

    return {
        "request": _to_request_out(req),
        "history": [
            HistoryOut(
                at=h.at,
                department=h.department,
                from_status=h.from_status,
                to_status=h.to_status,
                comment=h.comment,
            )
            for h in hist
        ],
    }



@app.get("/requests/{op_id}/history", response_model=list[HistoryOut])
def api_get_history(op_id: str, db: Session = Depends(get_db)):
    req = get_request(db, op_id)
    if not req:
        raise HTTPException(404, "Not found")
    hist = get_history(db, op_id)
    return [HistoryOut(at=h.at, department=h.department, from_status=h.from_status, to_status=h.to_status, comment=h.comment) for h in hist]

@app.post("/requests/{op_id}/status", response_model=RequestOut)
def api_update_status(op_id: str, body: StatusUpdateIn, db: Session = Depends(get_db)):
    req = get_request(db, op_id)
    if not req:
        raise HTTPException(404, "Not found")

    # validate enums lightly
    try:
        cur = Status(req.status)
        to = Status(body.to_status)
        Department(body.department)
    except Exception:
        raise HTTPException(400, "Invalid status/department")

    if to not in ALLOWED_TRANSITIONS[cur]:
        raise HTTPException(400, f"Transition not allowed: {cur.value} -> {to.value}")

    if not body.comment.strip():
        raise HTTPException(400, "Comment is required")

    updated = update_status(db, op_id, body.department, body.to_status, body.comment.strip(), body.planned_date)
    return _to_request_out(updated)

@app.get("/planning", response_model=list[RequestOut])
def api_planning(db: Session = Depends(get_db)):
    items = list_planning(db)
    return [_to_request_out(r) for r in items]

@app.post("/assistant", response_model=AssistantOut)
def api_assistant(body: AssistantIn, db: Session = Depends(get_db)):
    answer_text, refs = assistant_answer(db, body.question)
    return AssistantOut(answer=answer_text, references=refs)

def _to_request_out(r) -> RequestOut:
    return RequestOut(
        op_id=r.op_id,
        feature=r.feature,
        parameter=r.parameter,
        value=r.value,
        zone=r.zone,
        sites=r.sites,
        desired_date=r.desired_date,
        planned_date=r.planned_date,
        priority=r.priority,
        initial_comment=r.initial_comment,
        status=r.status,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )
