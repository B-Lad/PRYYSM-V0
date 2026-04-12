from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# 1. Fix the URL: Remove '+asyncpg' because we are switching to standard sync mode
db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

# 2. Create standard engine
engine = create_engine(db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 3. Standard Dependency (Yields a Session, not an AsyncSession)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()