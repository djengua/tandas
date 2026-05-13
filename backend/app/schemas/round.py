from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.round import EstadoRonda


class RoundResponse(BaseModel):
    id: UUID
    tanda_id: UUID
    numero: int
    fecha_limite: datetime
    cobrador_id: UUID | None = None
    estado: EstadoRonda
    pagada: bool = False
    cobrador_nombre: str | None = None

    model_config = {"from_attributes": True}


class RoundDetailResponse(RoundResponse):
    pagos: list["PaymentResponse"] = []


from app.schemas.payment import PaymentResponse

RoundDetailResponse.model_rebuild()
