import random
from datetime import timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.participant import Participant
from app.models.payment import EstadoPago, Payment
from app.models.round import EstadoRonda, Round
from app.models.tanda import EstadoTanda, Tanda
from app.utils.date import now_mexico


async def iniciar_tanda(db: AsyncSession, tanda_id: UUID) -> Tanda:
    result = await db.execute(select(Tanda).where(Tanda.id == tanda_id))
    tanda = result.scalar_one_or_none()
    if not tanda:
        raise ValueError("Tanda no encontrada")
    if tanda.estado != EstadoTanda.PENDIENTE:
        raise ValueError("La tanda ya ha sido iniciada")

    # Get participants
    parts = await db.execute(
        select(Participant).where(Participant.tanda_id == tanda_id).order_by(Participant.fecha_ingreso)
    )
    participantes = parts.scalars().all()

    if len(participantes) < 2:
        raise ValueError("Se necesitan al menos 2 participantes")

    # Assign order to participants without one, preserving existing manual orders
    if not tanda.orden_sorteado:
        sin_orden = [p for p in participantes if p.orden is None]
        if sin_orden:
            used = {p.orden for p in participantes if p.orden is not None}
            available = [n for n in range(1, len(participantes) + 1) if n not in used]
            random.shuffle(available)
            for p in sin_orden:
                p.orden = available.pop()
        tanda.orden_sorteado = True

    # Sort participants by order
    participantes.sort(key=lambda p: p.orden)

    # Calculate period days
    period_days = {"semanal": 7, "quincenal": 15, "mensual": 30}[tanda.tipo_periodo]

    # Create rounds
    fecha_base = tanda.fecha_inicio if tanda.fecha_inicio else now_mexico()
    tanda.estado = EstadoTanda.ACTIVA

    if tanda.tipo_tanda == "caja_ahorro":
        for i in range(len(participantes)):
            fecha_limite = fecha_base + timedelta(days=period_days * i)
            ronda = Round(
                tanda_id=tanda.id,
                numero=i + 1,
                fecha_limite=fecha_limite,
                cobrador_id=None,
                estado=EstadoRonda.PENDIENTE,
            )
            db.add(ronda)
            await db.flush()

            for pagador in participantes:
                pago = Payment(
                    ronda_id=ronda.id,
                    participante_id=pagador.id,
                    monto=tanda.monto_periodo,
                    estado=EstadoPago.PENDIENTE,
                )
                db.add(pago)
    else:
        for i, cobrador in enumerate(participantes):
            fecha_limite = fecha_base + timedelta(days=period_days * i)
            ronda = Round(
                tanda_id=tanda.id,
                numero=i + 1,
                fecha_limite=fecha_limite,
                cobrador_id=cobrador.id,
                estado=EstadoRonda.PENDIENTE,
            )
            db.add(ronda)
            await db.flush()

            for pagador in participantes:
                pago = Payment(
                    ronda_id=ronda.id,
                    participante_id=pagador.id,
                    monto=tanda.monto_periodo,
                    estado=EstadoPago.PENDIENTE,
                )
                db.add(pago)

    await db.flush()
    await db.refresh(tanda)
    return tanda


async def sortear_orden(db: AsyncSession, tanda_id: UUID) -> list[Participant]:
    result = await db.execute(select(Tanda).where(Tanda.id == tanda_id))
    tanda = result.scalar_one_or_none()
    if not tanda:
        raise ValueError("Tanda no encontrada")
    if tanda.orden_sorteado:
        raise ValueError("El orden ya ha sido sorteado")

    parts = await db.execute(
        select(Participant).where(Participant.tanda_id == tanda_id).order_by(Participant.fecha_ingreso)
    )
    participantes = parts.scalars().all()

    ordenes = list(range(1, len(participantes) + 1))
    random.shuffle(ordenes)
    for i, p in enumerate(participantes):
        p.orden = ordenes[i]
    tanda.orden_sorteado = True

    await db.flush()
    return participantes


async def definir_orden(db: AsyncSession, tanda_id: UUID, orden: list[dict]) -> list[Participant]:
    result = await db.execute(select(Tanda).where(Tanda.id == tanda_id))
    tanda = result.scalar_one_or_none()
    if not tanda:
        raise ValueError("Tanda no encontrada")
    if tanda.orden_sorteado:
        raise ValueError("El orden ya ha sido definido")

    for item in orden:
        pid = item["participante_id"]
        orden_val = item["orden"]
        p_result = await db.execute(
            select(Participant).where(Participant.id == pid, Participant.tanda_id == tanda_id)
        )
        p = p_result.scalar_one_or_none()
        if p:
            p.orden = orden_val

    tanda.orden_sorteado = True
    await db.flush()

    parts = await db.execute(
        select(Participant).where(Participant.tanda_id == tanda_id).order_by(Participant.orden)
    )
    return parts.scalars().all()
