from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.tanda import TandaCreate, TandaDetailResponse, TandaResponse, TandaUpdate
from app.services.tanda import create_tanda, delete_tanda, get_tanda_by_id, get_user_tandas, update_tanda

router = APIRouter()


@router.get("", response_model=list[TandaResponse])
async def list_tandas(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_user_tandas(db, current_user.id)


@router.post("", response_model=TandaResponse, status_code=201)
async def create(data: TandaCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await create_tanda(db, data, current_user.id)


@router.get("/{tanda_id}", response_model=TandaDetailResponse)
async def get_tanda(tanda_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tanda = await get_tanda_by_id(db, tanda_id)
    if not tanda:
        raise HTTPException(status_code=404, detail="Tanda no encontrada")
    return tanda


@router.put("/{tanda_id}", response_model=TandaResponse)
async def update(tanda_id: UUID, data: TandaUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tanda = await update_tanda(db, tanda_id, data)
    if not tanda:
        raise HTTPException(status_code=404, detail="Tanda no encontrada")
    return tanda


@router.delete("/{tanda_id}")
async def cancel(tanda_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    success = await delete_tanda(db, tanda_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tanda no encontrada")
    return {"message": "Tanda cancelada"}
