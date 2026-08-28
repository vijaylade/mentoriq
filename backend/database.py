import os
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_CONNECTION_STRING = os.environ["DATABASE_CONNECTION_STRING"]

engine = create_engine(
    DATABASE_CONNECTION_STRING,
    pool_pre_ping=True,
    future=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
