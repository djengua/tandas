from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.payment import PaymentResponse
from app.schemas.round import RoundResponse
from app.services.pago import cobrar_ronda, pagar_ronda, register_payment
from app.api.rounds import _cobrador_nombre

router = APIRouter()


@router.post("/{tanda_id}/rondas/{ronda_id}/pagos/{participante_id}", response_model=PaymentResponse)
async def pay_round(
    tanda_id: UUID,
    ronda_id: UUID,
    participante_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        pago = await register_payment(db, ronda_id, participante_id, current_user.id)
        pr = PaymentResponse.model_validate(pago)
        from sqlalchemy import select
        from app.models.participant import Participant
        p_result = await db.execute(select(Participant).where(Participant.id == pago.participante_id))
        p = p_result.scalar_one_or_none()
        if p:
            u_result = await db.execute(select(User).where(User.id == p.usuario_id))
            u = u_result.scalar_one_or_none()
            if u:
                pr.participante_nombre = u.nombre
        return pr
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{tanda_id}/rondas/{ronda_id}/cobrar")
async def collect_round(tanda_id: UUID, ronda_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        await cobrar_ronda(db, ronda_id)
        return {"message": "Ronda cobrada exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{tanda_id}/rondas/{ronda_id}/pagar", response_model=RoundResponse)
async def pay_round_to_cobrador(tanda_id: UUID, ronda_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        ronda = await pagar_ronda(db, ronda_id)
        rr = RoundResponse.model_validate(ronda)
        rr.cobrador_nombre = await _cobrador_nombre(db, ronda.cobrador_id)
        return rr
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
