from __future__ import annotations
import os, json, re
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from .constants import Status
from .repo import list_requests

load_dotenv()

def _extract_op_id(question: str) -> Optional[str]:
    m = re.search(r"(OP-\d{4}-\d{4})", question.upper())
    return m.group(1) if m else None

def _build_context(db: Session) -> Dict[str, Any]:
    # keep context small: latest 200 ops is enough for demo
    ops = list_requests(db, status="ALL", q=None)[:200]
    compact = []
    for r in ops:
        compact.append({
            "op_id": r.op_id,
            "feature": r.feature,
            "parameter": r.parameter,
            "value": r.value,
            "zone": r.zone,
            "sites": r.sites,
            "desired_date": r.desired_date,
            "planned_date": r.planned_date,
            "priority": r.priority,
            "status": r.status,
            "updated_at": r.updated_at,
        })
    return {"operations": compact}

def _safe_answer(question: str, ctx: Dict[str, Any]) -> Tuple[str, List[str]]:
    ops = ctx.get("operations", [])
    if not ops:
        return ("Information non disponible dans la base.", [])

    q = question.lower()
    op_id = _extract_op_id(question)

    # 4 supported intents
    if op_id:
        for o in ops:
            if o["op_id"] == op_id:
                return (f"Statut de {op_id}: {o['status']} (priority: {o['priority']}, feature: {o['feature']}).", [op_id])
        return ("Information non disponible dans la base.", [])

    if "échec" in q or "en echec" in q or "failed" in q:
        failed = [o for o in ops if o.get("status") == Status.FAILED.value]
        refs = [o["op_id"] for o in failed[:12]]
        if not refs:
            return ("Non. Aucune opération en échec dans la base.", [])
        return (f"Oui. {len(failed)} opération(s) en échec. Voir: {', '.join(refs)}.", refs)

    if "exécut" in q or "execut" in q or "done" in q:
        done = [o for o in ops if o.get("status") == Status.EXECUTED.value]
        refs = [o["op_id"] for o in done[:12]]
        if not refs:
            return ("Aucune opération exécutée dans la base.", [])
        return (f"Opérations exécutées: {', '.join(refs)}.", refs)

    if "plan" in q or "planning" in q or "cette semaine" in q or "prévu" in q:
        planned = [o for o in ops if o.get("status") == Status.PLANNED.value]
        refs = [o["op_id"] for o in planned[:12]]
        if not refs:
            return ("Aucune opération planifiée dans la base.", [])
        return (f"Opérations planifiées: {', '.join(refs)}.", refs)

    return ("Je peux répondre sur: planifiées / exécutées / en échec / statut d'une opération (OP-YYYY-NNNN).", [])

def _llm_parse_intent(client, question: str, ctx: Dict[str, Any]) -> Dict[str, Any]:
    """
    Return a strict JSON like:
    {
      "normalized_question": "...",
      "intent": "GET_STATUS" | "LIST_PLANNED" | "LIST_EXECUTED" | "LIST_FAILED" | "HELP",
      "op_id": "OP-2026-0003" | null
    }
    Must not invent op_id; if unsure, op_id = null.
    """
    ops = ctx.get("operations", [])
    known_ids = [o["op_id"] for o in ops[:200]]

    system = (
        "You are a parser for a network operations demo. "
        "Your job is to interpret a potentially misspelled French question and output ONLY a JSON object. "
        "Do not include any extra text."
    )

    user = {
        "question": question,
        "known_op_ids": known_ids,
        "rules": [
            "If the user mentions an OP id with typos, map to the closest known_op_id when very likely (e.g. OP-2026-OOO3 -> OP-2026-0003).",
            "If no clear OP id, op_id must be null.",
            "intent must be one of: GET_STATUS, LIST_PLANNED, LIST_EXECUTED, LIST_FAILED, HELP.",
            "Use LIST_PLANNED for words like planifie, prévu, planning, cette semaine.",
            "Use LIST_EXECUTED for words like exécuté, fait, terminé, done.",
            "Use LIST_FAILED for words like échec, failed, erreur.",
            "Use GET_STATUS when user asks status of a specific OP id."
        ],
        "output_json_schema": {
            "normalized_question": "string",
            "intent": "string",
            "op_id": "string|null"
        }
    }

    resp = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        input=[
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
        ],
        temperature=0.0,
        max_output_tokens=200,
    )

    text = (resp.output_text or "").strip()
    try:
        parsed = json.loads(text)
    except Exception:
        # fallback if model didn't output pure json
        return {"normalized_question": question, "intent": "HELP", "op_id": None}

    # normalize & guard
    intent = str(parsed.get("intent", "HELP")).upper()
    if intent not in {"GET_STATUS", "LIST_PLANNED", "LIST_EXECUTED", "LIST_FAILED", "HELP"}:
        intent = "HELP"

    op_id = parsed.get("op_id", None)
    if op_id is not None:
        op_id = str(op_id).upper()
        if not re.match(r"^OP-\d{4}-\d{4}$", op_id):
            op_id = None

    return {
        "normalized_question": str(parsed.get("normalized_question", question)),
        "intent": intent,
        "op_id": op_id,
    }


def _parse_llm(text: str) -> Tuple[str, List[str]]:
    # Expected format:
    # Réponse: ...
    # Références: [OP-...., ...]
    answer = text.strip()
    refs: List[str] = []
    m_ans = re.search(r"Réponse\s*:\s*(.*)", text, re.IGNORECASE | re.DOTALL)
    if m_ans:
        answer = m_ans.group(1).strip()
        # cut before references
        answer = re.split(r"Références\s*:\s*", answer, flags=re.IGNORECASE)[0].strip()

    m_refs = re.search(r"Références\s*:\s*(\[.*?\])", text, re.IGNORECASE | re.DOTALL)
    if m_refs:
        raw = m_refs.group(1)
        refs = re.findall(r"OP-\d{4}-\d{4}", raw.upper())

    return answer, refs

def answer(db: Session, question: str) -> Tuple[str, List[str]]:
    ctx = _build_context(db)

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return _safe_answer(question, ctx)

    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    parsed = _llm_parse_intent(client, question, ctx)

    ops = ctx.get("operations", [])
    if not ops:
        return ("Information non disponible dans la base.", [])

    intent = parsed["intent"]
    op_id = parsed["op_id"]

    # === Strictly DB-based answers ===
    if intent == "GET_STATUS" and op_id:
        for o in ops:
            if o["op_id"] == op_id:
                return (
                    f"Statut de {op_id}: {o['status']} (priority: {o['priority']}, feature: {o['feature']}).",
                    [op_id],
                )
        return ("Information non disponible dans la base.", [])

    if intent == "LIST_FAILED":
        failed = [o for o in ops if o.get("status") == Status.FAILED.value]
        refs = [o["op_id"] for o in failed[:12]]
        if not refs:
            return ("Non. Aucune opération en échec dans la base.", [])
        return (f"Oui. {len(failed)} opération(s) en échec. Voir: {', '.join(refs)}.", refs)

    if intent == "LIST_EXECUTED":
        done = [o for o in ops if o.get("status") == Status.EXECUTED.value]
        refs = [o["op_id"] for o in done[:12]]
        if not refs:
            return ("Aucune opération exécutée dans la base.", [])
        return (f"Opérations exécutées: {', '.join(refs)}.", refs)

    if intent == "LIST_PLANNED":
        planned = [o for o in ops if o.get("status") == Status.PLANNED.value]
        refs = [o["op_id"] for o in planned[:12]]
        if not refs:
            return ("Aucune opération planifiée dans la base.", [])
        return (f"Opérations planifiées: {', '.join(refs)}.", refs)

    return ("Je peux répondre sur: planifiées / exécutées / en échec / statut d'une opération (OP-YYYY-NNNN).", [])
