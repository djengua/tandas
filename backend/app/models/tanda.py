import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.date import now_mexico

import enum


class TipoPeriodo(str, enum.Enum):
    SEMANAL = "semanal"
    QUINCENAL = "quincenal"
    MENSUAL = "mensual"


class TipoTanda(str, enum.Enum):
    CLASICO = "clasico"
    CAJA_AHORRO = "caja_ahorro"


class EstadoTanda(str, enum.Enum):
    PENDIENTE = "pendiente"
    ACTIVA = "activa"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"


class Tanda(Base):
    __tablename__ = "tandas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    monto_periodo: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    tipo_periodo: Mapped[TipoPeriodo] = mapped_column(String(20), nullable=False)
    tipo_tanda: Mapped[str] = mapped_column(String(20), default="clasico")
    numero_participantes: Mapped[int] = mapped_column(Integer, nullable=False)
    num_rondas: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    fecha_inicio: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fecha_fin: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    estado: Mapped[EstadoTanda] = mapped_column(Enum(EstadoTanda), default=EstadoTanda.PENDIENTE)
    orden_sorteado: Mapped[bool] = mapped_column(Boolean, default=False)
    creador_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_mexico)

    creador = relationship("User", back_populates="tandas_creadas")
    participantes = relationship("Participant", back_populates="tanda", cascade="all, delete-orphan")
    rondas = relationship("Round", back_populates="tanda", cascade="all, delete-orphan")
