import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.date import now_mexico


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tanda_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tandas.id"), nullable=False)
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    nombre_invitado: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email_invitado: Mapped[str | None] = mapped_column(String(255), nullable=True)
    es_invitado: Mapped[bool] = mapped_column(Boolean, default=False)
    orden: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fecha_ingreso: Mapped[datetime] = mapped_column(DateTime, default=now_mexico)

    tanda = relationship("Tanda", back_populates="participantes")
    usuario = relationship("User", back_populates="participaciones", lazy="selectin")
    pagos = relationship("Payment", back_populates="participante", cascade="all, delete-orphan")
