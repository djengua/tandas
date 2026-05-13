from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.participant import Participant
from app.models.tanda import EstadoTanda, Tanda
from app.schemas.tanda import TandaCreate, TandaResponse, TandaUpdate
from app.services.calculo import (
    PERIOD_DAYS,
    ajustar_fecha_fin,
    calcular_numero_rondas,
)


async def create_tanda(db: AsyncSession, data: TandaCreate, creador_id: UUID) -> TandaResponse:
    if data.tipo_tanda == "clasico" and data.num_rondas:
        num_rondas = data.num_rondas
    elif data.tipo_tanda == "clasico" and data.numero_participantes:
        num_rondas = data.numero_participantes
    else:
        num_rondas = calcular_numero_rondas(
            data.fecha_inicio, data.fecha_fin, data.tipo_periodo
        )

    fecha_fin_ajustada = ajustar_fecha_fin(data.fecha_inicio, num_rondas, data.tipo_periodo)

    advertencia = None
    if fecha_fin_ajustada != data.fecha_fin:
        period_days = PERIOD_DAYS[data.tipo_periodo]
        label = data.tipo_periodo
        advertencia = (
            f"La fecha final se ajustó de {data.fecha_fin.strftime('%d/%m/%Y')} "
            f"a {fecha_fin_ajustada.strftime('%d/%m/%Y')} para alinearse "
            f"con la periodicidad {label} (cada {period_days} días)"
        )

    tanda = Tanda(
        nombre=data.nombre,
        descripcion=data.descripcion,
        monto_periodo=data.monto_periodo,
        tipo_periodo=data.tipo_periodo,
        tipo_tanda=data.tipo_tanda,
        numero_participantes=data.numero_participantes if data.numero_participantes else num_rondas,
        num_rondas=num_rondas if data.tipo_tanda == "clasico" else 0,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=fecha_fin_ajustada,
        creador_id=creador_id,
    )
    db.add(tanda)
    await db.flush()
    await db.refresh(tanda)

    # Add creator as first participant
    participante = Participant(tanda_id=tanda.id, usuario_id=creador_id)
    db.add(participante)
    await db.flush()

    tr = await get_tanda_by_id(db, tanda.id)
    tr.advertencia = advertencia
    return tr


async def get_user_tandas(db: AsyncSession, user_id: UUID) -> list[TandaResponse]:
    result = await db.execute(
        select(Tanda)
        .outerjoin(Participant, Tanda.id == Participant.tanda_id)
        .where((Tanda.creador_id == user_id) | (Participant.usuario_id == user_id))
        .distinct()
        .order_by(Tanda.created_at.desc())
    )
    tandaS = result.scalars().all()
    result_list = []
    for t in tandaS:
        tr = TandaResponse.model_validate(t)
        # count participants
        pc = await db.execute(select(func.count(Participant.id)).where(Participant.tanda_id == t.id))
        tr.participantes_count = pc.scalar()
        result_list.append(tr)
    return result_list


async def get_tanda_by_id(db: AsyncSession, tanda_id: UUID) -> TandaResponse | None:
    result = await db.execute(select(Tanda).where(Tanda.id == tanda_id))
    tanda = result.scalar_one_or_none()
    if tanda is None:
        return None
    tr = TandaResponse.model_validate(tanda)
    pc = await db.execute(select(func.count(Participant.id)).where(Participant.tanda_id == tanda.id))
    tr.participantes_count = pc.scalar()
    return tr


async def update_tanda(db: AsyncSession, tanda_id: UUID, data: TandaUpdate) -> TandaResponse | None:
    result = await db.execute(select(Tanda).where(Tanda.id == tanda_id))
    tanda = result.scalar_one_or_none()
    if tanda is None:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tanda, key, value)

    await db.flush()
    return await get_tanda_by_id(db, tanda_id)


async def delete_tanda(db: AsyncSession, tanda_id: UUID) -> bool:
    result = await db.execute(select(Tanda).where(Tanda.id == tanda_id))
    tanda = result.scalar_one_or_none()
    if tanda is None:
        return False
    tanda.estado = EstadoTanda.CANCELADA
    await db.flush()
    return True