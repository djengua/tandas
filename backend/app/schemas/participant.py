from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class ParticipantCreate(BaseModel):
    usuario_id: UUID | None = None
    nombre_invitado: str | None = None
    email_invitado: str | None = None

    @field_validator("usuario_id")
    @classmethod
    def check_at_least_one(cls, v, info):
        data = info.data
        if v is None and not data.get("nombre_invitado") and not data.get("email_invitado"):
            raise ValueError("Debe proporcionar usuario_id o nombre_invitado/email_invitado")
        if v is not None and data.get("nombre_invitado"):
            raise ValueError("No puede proporcionar usuario_id y nombre_invitado simultáneamente")
        return v


class ParticipantUpdate(BaseModel):
    orden: int | None = None


class ParticipantResponse(BaseModel):
    id: UUID
    tanda_id: UUID
    usuario_id: UUID | None = None
    nombre_invitado: str | None = None
    email_invitado: str | None = None
    es_invitado: bool = False
    orden: int | None = None
    fecha_ingreso: datetime
    nombre_display: str | None = None
    email_display: str | None = None

    model_config = {"from_attributes": True}
