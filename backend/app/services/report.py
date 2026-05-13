from uuid import UUID
from datetime import datetime
import csv
import io
from collections import defaultdict

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.participant import Participant
from app.models.payment import Payment
from app.models.round import EstadoRonda, Round
from app.models.tanda import Tanda
from app.models.user import User


async def get_tanda_report(db: AsyncSession, tanda_id: UUID) -> dict:
    # Basic info
    t_result = await db.execute(select(Tanda).where(Tanda.id == tanda_id))
    tanda = t_result.scalar_one_or_none()
    if not tanda:
        raise ValueError("Tanda no encontrada")

    # Participant count
    pc = await db.execute(select(func.count(Participant.id)).where(Participant.tanda_id == tanda_id))
    total_participantes = pc.scalar()

    # Round progress
    rc = await db.execute(select(func.count(Round.id)).where(Round.tanda_id == tanda_id))
    total_rondas = rc.scalar()

    rc_cobradas = await db.execute(
        select(func.count(Round.id)).where(
            Round.tanda_id == tanda_id,
            or_(Round.estado == EstadoRonda.COBRADA, Round.pagada == True),
        )
    )
    rondas_cobradas = rc_cobradas.scalar() or 0

    # Payment stats
    total_pagos = await db.execute(
        select(func.count(Payment.id))
        .join(Round, Payment.ronda_id == Round.id)
        .where(Round.tanda_id == tanda_id)
    )
    total_pagos = total_pagos.scalar() or 0

    pagos_completados = await db.execute(
        select(func.count(Payment.id))
        .join(Round, Payment.ronda_id == Round.id)
        .where(Round.tanda_id == tanda_id, Payment.estado == "pagado")
    )
    pagos_completados = pagos_completados.scalar() or 0

    # Total money
    total_monto = await db.execute(
        select(func.coalesce(func.sum(Payment.monto), 0))
        .join(Round, Payment.ronda_id == Round.id)
        .where(Round.tanda_id == tanda_id, Payment.estado == "pagado")
    )
    total_recaudado = float(total_monto.scalar() or 0)

    monto_esperado = float(tanda.monto_periodo) * \
        total_participantes * total_rondas

    # Payment per participant
    parts_result = await db.execute(
        select(Participant).where(Participant.tanda_id ==
                                  tanda_id).order_by(Participant.orden)
    )
    participantes = parts_result.scalars().all()

    detalle_participantes = []
    for p in participantes:
        pagos_p = await db.execute(
            select(func.count(Payment.id))
            .join(Round, Payment.ronda_id == Round.id)
            .where(Round.tanda_id == tanda_id, Payment.participante_id == p.id, Payment.estado == "pagado")
        )
        pagos_hechos = pagos_p.scalar() or 0

        monto_p = await db.execute(
            select(func.coalesce(func.sum(Payment.monto), 0))
            .join(Round, Payment.ronda_id == Round.id)
            .where(Round.tanda_id == tanda_id, Payment.participante_id == p.id, Payment.estado == "pagado")
        )
        monto_pagado = float(monto_p.scalar() or 0)

        nombre_display = None
        if p.es_invitado:
            nombre_display = p.nombre_invitado
        elif p.usuario_id:
            u_result = await db.execute(select(User).where(User.id == p.usuario_id))
            user = u_result.scalar_one_or_none()
            nombre_display = user.nombre if user else None

        detalle_participantes.append({
            "participante_id": str(p.id),
            "usuario_id": str(p.usuario_id),
            "nombre_display": nombre_display,
            "orden": p.orden,
            "pagos_hechos": pagos_hechos,
            "monto_pagado": monto_pagado,
            "pagos_pendientes": total_rondas - pagos_hechos,
        })

    return {
        "tanda_id": str(tanda_id),
        "tanda_nombre": tanda.nombre,
        "estado": tanda.estado.value,
        "monto_periodo": float(tanda.monto_periodo),
        "tipo_tanda": tanda.tipo_tanda,
        "total_participantes": total_participantes,
        "total_rondas": total_rondas,
        "rondas_cobradas": rondas_cobradas,
        "total_pagos": total_pagos,
        "pagos_completados": pagos_completados,
        "pagos_pendientes": total_pagos - pagos_completados,
        "monto_esperado": monto_esperado,
        "total_recaudado": total_recaudado,
        "porcentaje_completado": round((rondas_cobradas / total_rondas * 100) if total_rondas else 0, 1),
        "detalle_participantes": detalle_participantes,
        "rondas_data": await get_rondas_progress(db, tanda_id),
        "monto_acumulado_mes": await get_monto_acumulado_mes(db, tanda_id),
    }


async def get_rondas_progress(db: AsyncSession, tanda_id: UUID) -> list[dict]:
    rounds_result = await db.execute(
        select(Round).where(Round.tanda_id == tanda_id).order_by(Round.numero)
    )
    rounds = rounds_result.scalars().all()

    result = []
    for r in rounds:
        pagos_ronda = await db.execute(
            select(func.count(Payment.id)).where(
                Payment.ronda_id == r.id, 
                Payment.estado == "pagado"
            )
        )
        pagos_pagados = pagos_ronda.scalar() or 0

        total_part = await db.execute(
            select(func.count(Participant.id)).where(
                Participant.tanda_id == tanda_id)
        )
        total_participantes = total_part.scalar() or 0

        cobrador_nombre = "Pool"
        if r.cobrador_id:
            p_result = await db.execute(select(Participant).where(Participant.id == r.cobrador_id))
            p = p_result.scalar_one_or_none()
            if p:
                if p.es_invitado:
                    cobrador_nombre = p.nombre_invitado or "Invitado"
                elif p.usuario_id:
                    u_result = await db.execute(select(User).where(User.id == p.usuario_id))
                    u = u_result.scalar_one_or_none()
                    cobrador_nombre = u.nombre if u else "—"

        result.append({
            "numero": int(r.numero),
            "cobrador": cobrador_nombre,
            "pagos_recibidos": int(pagos_pagados),
            "total_participantes": int(total_participantes),
            "porcentaje": float(round((int(pagos_pagados) / int(total_participantes) * 100) if int(total_participantes) else 0, 1)),
            "estado": str(r.estado.value) if hasattr(r.estado, 'value') else str(r.estado),
        })

    return result


async def get_monto_acumulado_mes(db: AsyncSession, tanda_id: UUID) -> list[dict]:
    payments_result = await db.execute(
        select(Payment)
        .join(Round, Payment.ronda_id == Round.id)
        .where(
            Round.tanda_id == tanda_id,
            Payment.estado == "pagado",
            Payment.fecha_pago.isnot(None),
        )
    )
    payments = payments_result.scalars().all()

    meses = defaultdict(float)
    for p in payments:
        if p.fecha_pago:
            mes_key = p.fecha_pago.strftime("%Y-%m")
            meses[mes_key] += float(p.monto)

    result = []
    for mes, monto in sorted(meses.items()):
        fecha = datetime.strptime(mes, "%Y-%m")
        result.append({
            "mes": mes,
            "label": fecha.strftime("%b %Y"),
            "monto": monto,
        })

    return result


async def get_activities(db: AsyncSession, tanda_id: UUID) -> list[dict]:
    t_result = await db.execute(select(Tanda).where(Tanda.id == tanda_id))
    tanda = t_result.scalar_one_or_none()
    if not tanda:
        raise ValueError("Tanda no encontrada")

    activities = []

    pagos_result = await db.execute(
        select(Payment, Round, Participant)
        .join(Round, Payment.ronda_id == Round.id)
        .join(Participant, Payment.participante_id == Participant.id)
        .where(
            Round.tanda_id == tanda_id,
            Payment.estado == "pagado",
            Payment.fecha_pago.isnot(None),
        )
        .order_by(Payment.fecha_pago.desc())
        .limit(20)
    )

    for pago, ronda, participante in pagos_result:
        nombre = "Invitado"
        if participante.es_invitado:
            nombre = participante.nombre_invitado or "Invitado"
        elif participante.usuario_id:
            u_result = await db.execute(select(User).where(User.id == participante.usuario_id))
            u = u_result.scalar_one_or_none()
            nombre = u.nombre if u else "Invitado"

        activities.append({
            "type": "pago",
            "description": f"{nombre} pagó Ronda {ronda.numero}",
            "timestamp": pago.fecha_pago.strftime("%d/%m/%Y %H:%M") if pago.fecha_pago else None,
        })

    return activities


async def generate_csv_export(db: AsyncSession, tanda_id: UUID) -> str:
    t_result = await db.execute(select(Tanda).where(Tanda.id == tanda_id))
    tanda = t_result.scalar_one_or_none()
    if not tanda:
        raise ValueError("Tanda no encontrada")

    parts_result = await db.execute(
        select(Participant).where(Participant.tanda_id ==
                                  tanda_id).order_by(Participant.orden)
    )
    participantes = parts_result.scalars().all()

    rc = await db.execute(select(func.count(Round.id)).where(Round.tanda_id == tanda_id))
    total_rondas = rc.scalar() or 0

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Orden", "Participante", "Pagos Realizados",
                    "Monto Pagado", "Pagos Pendientes", "Saldo Pendiente"])

    for p in participantes:
        pagos_p = await db.execute(
            select(func.count(Payment.id))
            .join(Round, Payment.ronda_id == Round.id)
            .where(Round.tanda_id == tanda_id, Payment.participante_id == p.id, Payment.estado == "pagado")
        )
        pagos_hechos = pagos_p.scalar() or 0

        monto_p = await db.execute(
            select(func.coalesce(func.sum(Payment.monto), 0))
            .join(Round, Payment.ronda_id == Round.id)
            .where(Round.tanda_id == tanda_id, Payment.participante_id == p.id, Payment.estado == "pagado")
        )
        monto_pagado = float(monto_p.scalar() or 0)

        saldo_pendiente = float(tanda.monto_periodo) * \
            (total_rondas - pagos_hechos)

        nombre_display = "Invitado"
        if p.es_invitado:
            nombre_display = p.nombre_invitado or "Invitado"
        elif p.usuario_id:
            u_result = await db.execute(select(User).where(User.id == p.usuario_id))
            user = u_result.scalar_one_or_none()
            nombre_display = user.nombre if user else "Invitado"

        writer.writerow([
            p.orden or "-",
            nombre_display,
            pagos_hechos,
            f"${monto_pagado:.2f}",
            total_rondas - pagos_hechos,
            f"${saldo_pendiente:.2f}"
        ])

    return output.getvalue()
