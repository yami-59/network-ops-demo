from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Text, ForeignKey
from datetime import datetime
from typing import List, Optional

class Base(DeclarativeBase):
    pass

class Request(Base):
    __tablename__ = "requests"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    op_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    feature: Mapped[str] = mapped_column(String)
    parameter: Mapped[str] = mapped_column(String)
    value: Mapped[str] = mapped_column(String)
    zone: Mapped[str] = mapped_column(String)
    sites: Mapped[str] = mapped_column(Text)  # CSV for demo
    desired_date: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    planned_date: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    priority: Mapped[str] = mapped_column(String)
    initial_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String)
    created_at: Mapped[str] = mapped_column(String)
    updated_at: Mapped[str] = mapped_column(String)

    history: Mapped[List["HistoryEntry"]] = relationship(
        back_populates="request", cascade="all, delete-orphan", order_by="HistoryEntry.at"
    )

class HistoryEntry(Base):
    __tablename__ = "history"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    request_op_id: Mapped[str] = mapped_column(String, ForeignKey("requests.op_id", ondelete="CASCADE"), index=True)
    at: Mapped[str] = mapped_column(String)
    department: Mapped[str] = mapped_column(String)
    from_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    to_status: Mapped[str] = mapped_column(String)
    comment: Mapped[str] = mapped_column(Text)

    request: Mapped["Request"] = relationship(back_populates="history")
