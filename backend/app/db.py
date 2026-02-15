import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

def get_db_path() -> str:
    return os.getenv("DB_PATH", "data/app.db")

def get_engine() -> Engine:
    db_path = get_db_path()
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    return create_engine(f"sqlite:///{db_path}", future=True, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
