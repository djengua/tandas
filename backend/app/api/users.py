from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()


@router.get("/search", response_model=list[UserResponse])
async def search_users(
    email: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User).where(User.email.ilike(f"%{email}%")).limit(10)
    )
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]
