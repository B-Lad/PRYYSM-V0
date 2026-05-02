from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Ensure we use the sync driver for standard SQLAlchemy operations
db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

pool_kwargs = {
    "pool_pre_ping": True,
    "pool_size": 3,
    "max_overflow": 2,
    "pool_recycle": 300,
    "pool_timeout": 10,
    "connect_args": {
        "connect_timeout": 10,
        "options": "-c statement_timeout=30000",
    },
}

engine = create_engine(db_url, **pool_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that yields a sync SQLAlchemy Session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
