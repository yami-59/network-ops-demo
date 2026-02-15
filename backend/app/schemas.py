from pydantic import BaseModel, Field
from typing import Optional, List

class RequestCreate(BaseModel):
    feature: str
    parameter: str
    value: str
    zone: str
    sites: str = Field(..., description="CSV list for demo")
    desired_date: Optional[str] = None
    planned_date: Optional[str] = None
    priority: str = "High"
    initial_comment: Optional[str] = None

class RequestOut(BaseModel):
    op_id: str
    feature: str
    parameter: str
    value: str
    zone: str
    sites: str
    desired_date: Optional[str] = None
    planned_date: Optional[str] = None
    priority: str
    initial_comment: Optional[str] = None
    status: str
    created_at: str
    updated_at: str

class HistoryOut(BaseModel):
    at: str
    department: str
    from_status: Optional[str] = None
    to_status: str
    comment: Optional[str] = None

class RequestDetailOut(BaseModel):
    request: RequestOut
    history: List[HistoryOut]

class StatusUpdateIn(BaseModel):
    department: str
    to_status: str
    comment: str
    planned_date: Optional[str] = None

class AssistantIn(BaseModel):
    question: str

class AssistantOut(BaseModel):
    answer: str
    references: List[str]
