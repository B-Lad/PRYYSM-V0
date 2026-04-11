from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


async def init_db():
    """Create all tables on startup"""
    async with engine.begin() as conn:
        # Import all models so they're registered with Base.metadata
        from app.db import models  # noqa
        from app.db.base import Base
        await conn.run_sync(Base.metadata.create_all)
