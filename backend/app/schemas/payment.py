from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.payment import EstadoPago


class PaymentRegister(BaseModel):
    pass


class PaymentResponse(BaseModel):
    id: UUID
    ronda_id: UUID
    participante_id: UUID
    monto: float
    fecha_pago: datetime | None = None
    estado: EstadoPago
    participante_nombre: str | None = None

    model_config = {"from_attributes": True}
