import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

import enum


class EstadoPago(str, enum.Enum):
    PENDIENTE = "pendiente"
    PAGADO = "pagado"
    ATRASADO = "atrasado"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ronda_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rounds.id"), nullable=False)
    participante_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("participants.id"), nullable=False)
    monto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    fecha_pago: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    estado: Mapped[EstadoPago] = mapped_column(Enum(EstadoPago), default=EstadoPago.PENDIENTE)

    ronda = relationship("Round", back_populates="pagos")
    participante = relationship("Participant", back_populates="pagos")
