import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

import enum


class EstadoRonda(str, enum.Enum):
    PENDIENTE = "pendiente"
    COBRADA = "cobrada"
    SALTADA = "saltada"


class Round(Base):
    __tablename__ = "rounds"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tanda_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tandas.id"), nullable=False)
    numero: Mapped[int] = mapped_column(Integer, nullable=False)
    fecha_limite: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    cobrador_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("participants.id"), nullable=True)
    estado: Mapped[EstadoRonda] = mapped_column(Enum(EstadoRonda), default=EstadoRonda.PENDIENTE)
    pagada: Mapped[bool] = mapped_column(Boolean, default=False)

    tanda = relationship("Tanda", back_populates="rondas")
    cobrador = relationship("Participant", foreign_keys=[cobrador_id])
    pagos = relationship("Payment", back_populates="ronda", cascade="all, delete-orphan")
