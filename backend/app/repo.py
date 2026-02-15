from __future__ import annotations
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select
from .models import Request, HistoryEntry
from .utils import now_iso
from .constants import Status, Department

def next_op_id(db: Session) -> str:
    year = now_iso()[:4]
    prefix = f"OP-{year}-"
    last = db.execute(
        select(Request.op_id).where(Request.op_id.like(f"{prefix}%")).order_by(Request.op_id.desc()).limit(1)
    ).scalar_one_or_none()
    if not last:
        return f"{prefix}0001"
    try:
        n = int(last.split("-")[-1])
    except Exception:
        n = 0
    return f"{prefix}{n+1:04d}"

def create_request(db: Session, payload: Dict[str, Any]) -> str:
    op_id = next_op_id(db)
    ts = now_iso()
    req = Request(
        op_id=op_id,
        feature=payload["feature"].strip(),
        parameter=payload["parameter"].strip(),
        value=payload["value"].strip(),
        zone=payload["zone"].strip(),
        sites=payload["sites"].strip(),
        desired_date=(payload.get("desired_date") or None),
        planned_date=(payload.get("planned_date") or None),
        priority=payload.get("priority", "High"),
        initial_comment=(payload.get("initial_comment") or None),
        status=Status.PENDING.value,
        created_at=ts,
        updated_at=ts,
    )
    db.add(req)
    db.add(HistoryEntry(
        request_op_id=op_id,
        at=ts,
        department=Department.ENGINEERING.value,
        from_status=None,
        to_status=Status.PENDING.value,
        comment=(payload.get("initial_comment") or "Création de la demande."),
    ))
    db.commit()
    return op_id

def list_requests(db: Session, status: Optional[str], q: Optional[str]) -> List[Request]:
    stmt = select(Request)
    if status and status != "ALL":
        stmt = stmt.where(Request.status == status)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (Request.op_id.like(like)) | (Request.feature.like(like)) | (Request.parameter.like(like)) | (Request.zone.like(like))
        )
    stmt = stmt.order_by(Request.updated_at.desc())
    return list(db.execute(stmt).scalars().all())

def get_request(db: Session, op_id: str) -> Optional[Request]:
    return db.execute(select(Request).where(Request.op_id == op_id)).scalar_one_or_none()

def get_history(db: Session, op_id: str) -> List[HistoryEntry]:
    return list(db.execute(select(HistoryEntry).where(HistoryEntry.request_op_id == op_id).order_by(HistoryEntry.at.asc())).scalars().all())

def update_status(db: Session, op_id: str, department: str, to_status: str, comment: str, planned_date: Optional[str]) -> Request:
    req = get_request(db, op_id)
    if not req:
        raise ValueError("Request not found")
    from_status = req.status
    ts = now_iso()
    req.status = to_status
    if planned_date:
        req.planned_date = planned_date
    req.updated_at = ts
    db.add(req)
    db.add(HistoryEntry(
        request_op_id=op_id,
        at=ts,
        department=department,
        from_status=from_status,
        to_status=to_status,
        comment=comment,
    ))
    db.commit()
    db.refresh(req)
    return req

def list_planning(db: Session) -> List[Request]:
    stmt = select(Request).where(Request.status == Status.PLANNED.value).order_by(Request.planned_date.is_(None), Request.planned_date.asc(), Request.updated_at.desc())
    return list(db.execute(stmt).scalars().all())
