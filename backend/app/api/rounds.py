from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.participant import Participant
from app.models.round import Round
from app.models.user import User
from app.schemas.round import RoundDetailResponse, RoundResponse


async def _cobrador_nombre(db: AsyncSession, cobrador_id: UUID | None) -> str | None:
    if not cobrador_id:
        return None
    p_result = await db.execute(select(Participant).where(Participant.id == cobrador_id))
    p = p_result.scalar_one_or_none()
    if not p:
        return None
    if p.es_invitado:
        return p.nombre_invitado
    if p.usuario_id:
        u_result = await db.execute(select(User).where(User.id == p.usuario_id))
        u = u_result.scalar_one_or_none()
        return u.nombre if u else None
    return None


async def _participante_nombre(db: AsyncSession, participante_id: UUID) -> str | None:
    p_result = await db.execute(select(Participant).where(Participant.id == participante_id))
    p = p_result.scalar_one_or_none()
    if not p:
        return None
    if p.es_invitado:
        return p.nombre_invitado
    if p.usuario_id:
        u_result = await db.execute(select(User).where(User.id == p.usuario_id))
        u = u_result.scalar_one_or_none()
        return u.nombre if u else None
    return None


router = APIRouter()


@router.get("/{tanda_id}/rondas", response_model=list[RoundResponse])
async def list_rounds(tanda_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Round).where(Round.tanda_id == tanda_id).order_by(Round.numero)
    )
    rondas = result.scalars().all()
    response = []
    for r in rondas:
        rr = RoundResponse.model_validate(r)
        rr.cobrador_nombre = await _cobrador_nombre(db, r.cobrador_id)
        response.append(rr)
    return response


@router.get("/{tanda_id}/rondas/{ronda_id}", response_model=RoundDetailResponse)
async def get_round(tanda_id: UUID, ronda_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Round)
        .options(selectinload(Round.pagos))
        .where(Round.id == ronda_id, Round.tanda_id == tanda_id)
    )
    ronda = result.scalar_one_or_none()
    if not ronda:
        raise HTTPException(status_code=404, detail="Ronda no encontrada")

    rr = RoundDetailResponse.model_validate(ronda)
    rr.cobrador_nombre = await _cobrador_nombre(db, ronda.cobrador_id)

    for pr in rr.pagos:
        pr.participante_nombre = await _participante_nombre(db, pr.participante_id)

    return rr
