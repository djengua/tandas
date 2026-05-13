from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.participant import Participant
from app.models.payment import EstadoPago, Payment
from app.models.round import EstadoRonda, Round
from app.models.tanda import EstadoTanda, Tanda
from app.utils.date import now_mexico


async def register_payment(db: AsyncSession, ronda_id: UUID, participante_id: UUID, user_id: UUID) -> Payment:
    # Verify round exists
    r_result = await db.execute(select(Round).where(Round.id == ronda_id))
    ronda = r_result.scalar_one_or_none()
    if not ronda:
        raise ValueError("Ronda no encontrada")

    # Verify tanda is active
    t_result = await db.execute(select(Tanda).where(Tanda.id == ronda.tanda_id))
    tanda = t_result.scalar_one_or_none()
    if tanda.estado != EstadoTanda.ACTIVA:
        raise ValueError("La tanda no está activa")

    # Verify participant belongs to this tanda
    p_result = await db.execute(
        select(Participant).where(
            Participant.id == participante_id,
            Participant.tanda_id == ronda.tanda_id,
        )
    )
    participante = p_result.scalar_one_or_none()
    if not participante:
        raise ValueError("El participante no pertenece a esta tanda")

    # Find or create payment
    pay_result = await db.execute(
        select(Payment).where(
            Payment.ronda_id == ronda_id,
            Payment.participante_id == participante_id,
        )
    )
    pago = pay_result.scalar_one_or_none()

    if pago:
        pago.estado = EstadoPago.PAGADO
        pago.fecha_pago = now_mexico()
    else:
        pago = Payment(
            ronda_id=ronda_id,
            participante_id=participante_id,
            monto=tanda.monto_periodo,
            estado=EstadoPago.PAGADO,
            fecha_pago=now_mexico(),
        )
        db.add(pago)

    await db.flush()

    total = await db.scalar(
        select(func.count(Participant.id)).where(Participant.tanda_id == ronda.tanda_id)
    )
    paid = await db.scalar(
        select(func.count(Payment.id)).where(
            Payment.ronda_id == ronda_id,
            Payment.estado == EstadoPago.PAGADO,
        )
    )
    if total == paid:
        ronda.estado = EstadoRonda.COBRADA
        await db.flush()

    await db.refresh(pago)
    return pago


async def cobrar_ronda(db: AsyncSession, ronda_id: UUID) -> Round:
    r_result = await db.execute(select(Round).where(Round.id == ronda_id))
    ronda = r_result.scalar_one_or_none()
    if not ronda:
        raise ValueError("Ronda no encontrada")

    ronda.estado = EstadoRonda.COBRADA
    await db.flush()
    await db.refresh(ronda)
    return ronda


async def pagar_ronda(db: AsyncSession, ronda_id: UUID) -> Round:
    r_result = await db.execute(select(Round).where(Round.id == ronda_id))
    ronda = r_result.scalar_one_or_none()
    if not ronda:
        raise ValueError("Ronda no encontrada")

    if ronda.estado == EstadoRonda.PENDIENTE:
        total = await db.scalar(
            select(func.count(Participant.id)).where(Participant.tanda_id == ronda.tanda_id)
        )
        paid = await db.scalar(
            select(func.count(Payment.id)).where(
                Payment.ronda_id == ronda_id,
                Payment.estado == EstadoPago.PAGADO,
            )
        )
        if total != paid:
            raise ValueError("Aún no todos los participantes han pagado esta ronda")
        ronda.estado = EstadoRonda.COBRADA
        await db.flush()

    if ronda.estado != EstadoRonda.COBRADA:
        raise ValueError("La ronda debe estar cobrada antes de pagarla")

    ronda.pagada = True
    await db.flush()

    remaining = await db.scalar(
        select(func.count(Round.id)).where(
            Round.tanda_id == ronda.tanda_id,
            Round.pagada == False,
        )
    )
    if remaining == 0:
        t_result = await db.execute(select(Tanda).where(Tanda.id == ronda.tanda_id))
        tanda = t_result.scalar_one_or_none()
        if tanda:
            tanda.estado = EstadoTanda.COMPLETADA
            await db.flush()

    await db.refresh(ronda)
    return ronda


async def get_round_payments(db: AsyncSession, ronda_id: UUID) -> list[Payment]:
    result = await db.execute(
        select(Payment).where(Payment.ronda_id == ronda_id)
    )
    return result.scalars().all()
