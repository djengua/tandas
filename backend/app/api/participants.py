from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func as sa_func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.participant import Participant
from app.models.tanda import Tanda
from app.models.user import User
from app.schemas.participant import ParticipantCreate, ParticipantResponse, ParticipantUpdate
from app.services.sorteo import definir_orden, sortear_orden, iniciar_tanda

router = APIRouter()


async def _enrich_participant(db: AsyncSession, p: Participant) -> ParticipantResponse:
    pr = ParticipantResponse.model_validate(p)
    if p.usuario_id and not p.es_invitado:
        user_result = await db.execute(select(User).where(User.id == p.usuario_id))
        user = user_result.scalar_one_or_none()
        if user:
            pr.nombre_display = user.nombre
            pr.email_display = user.email
    else:
        pr.nombre_display = p.nombre_invitado
        pr.email_display = p.email_invitado
    return pr


@router.get("/{tanda_id}/participantes", response_model=list[ParticipantResponse])
async def list_participants(tanda_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Participant).where(Participant.tanda_id == tanda_id).order_by(Participant.orden)
    )
    participantes = result.scalars().all()
    response = []
    for p in participantes:
        response.append(await _enrich_participant(db, p))
    return response


@router.post("/{tanda_id}/participantes", response_model=ParticipantResponse, status_code=201)
async def add_participant(tanda_id: UUID, data: ParticipantCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    t_result = await db.execute(select(Tanda).where(Tanda.id == tanda_id))
    tanda = t_result.scalar_one_or_none()
    if not tanda:
        raise HTTPException(status_code=404, detail="Tanda no encontrada")

    # Check if registered user is already a participant
    if data.usuario_id:
        existing = await db.execute(
            select(Participant).where(Participant.tanda_id == tanda_id, Participant.usuario_id == data.usuario_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="El usuario ya es participante")

    # Check participant count
    count_result = await db.execute(
        select(sa_func.count(Participant.id)).where(Participant.tanda_id == tanda_id)
    )
    count = count_result.scalar()
    max_limit = tanda.num_rondas if tanda.tipo_tanda == "clasico" and tanda.num_rondas else None
    if max_limit and count and count >= max_limit:
        raise HTTPException(status_code=400, detail="La tanda ya tiene el máximo de participantes")

    # Auto-assign consecutive orden
    max_ord = await db.execute(
        select(sa_func.max(Participant.orden)).where(Participant.tanda_id == tanda_id)
    )
    next_orden = (max_ord.scalar() or 0) + 1

    if data.usuario_id:
        participante = Participant(tanda_id=tanda_id, usuario_id=data.usuario_id, es_invitado=False, orden=next_orden)
    else:
        participante = Participant(
            tanda_id=tanda_id,
            usuario_id=None,
            nombre_invitado=data.nombre_invitado,
            email_invitado=data.email_invitado,
            es_invitado=True,
            orden=next_orden,
        )

    db.add(participante)
    await db.flush()
    await db.refresh(participante)
    return await _enrich_participant(db, participante)


@router.delete("/{tanda_id}/participantes/{participante_id}")
async def remove_participant(tanda_id: UUID, participante_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Participant).where(Participant.id == participante_id, Participant.tanda_id == tanda_id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Participante no encontrado")
    await db.delete(p)
    await db.flush()
    return {"message": "Participante eliminado"}


@router.patch("/{tanda_id}/participantes/{participante_id}", response_model=ParticipantResponse)
async def update_participant(tanda_id: UUID, participante_id: UUID, data: ParticipantUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Participant).where(Participant.id == participante_id, Participant.tanda_id == tanda_id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Participante no encontrado")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(p, key, value)
    await db.flush()
    await db.refresh(p)
    return await _enrich_participant(db, p)


@router.post("/{tanda_id}/sortear")
async def sort(tanda_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        participantes = await sortear_orden(db, tanda_id)
        return {"message": "Orden sorteado exitosamente", "sorteado": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{tanda_id}/orden")
async def set_order(tanda_id: UUID, orden: list[dict], db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        await definir_orden(db, tanda_id, orden)
        return {"message": "Orden definido exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{tanda_id}/iniciar")
async def start(tanda_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        await iniciar_tanda(db, tanda_id)
        return {"message": "Tanda iniciada exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
