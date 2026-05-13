from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.utils.date import MEXICO_TZ


class TandaCreate(BaseModel):
    nombre: str
    descripcion: str | None = None
    monto_periodo: float
    tipo_periodo: str = Field(pattern="^(semanal|quincenal|mensual)$")
    tipo_tanda: str = Field(default="clasico", pattern="^(clasico|caja_ahorro)$")
    fecha_inicio: datetime
    fecha_fin: datetime
    numero_participantes: int | None = None
    num_rondas: int | None = None

    @field_validator("fecha_inicio", "fecha_fin")
    @classmethod
    def strip_tz(cls, v):
        if v is not None and v.tzinfo is not None:
            return v.astimezone(MEXICO_TZ).replace(tzinfo=None)
        return v

    @field_validator("fecha_fin")
    @classmethod
    def check_dates(cls, v, info):
        inicio = info.data.get("fecha_inicio")
        if inicio and v <= inicio:
            raise ValueError("fecha_fin debe ser posterior a fecha_inicio")
        return v


class TandaUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    monto_periodo: float | None = None
    tipo_periodo: str | None = None
    estado: str | None = None


class TandaResponse(BaseModel):
    id: UUID
    nombre: str
    descripcion: str | None = None
    monto_periodo: float
    tipo_periodo: str
    tipo_tanda: str
    numero_participantes: int
    num_rondas: int | None = None
    fecha_inicio: datetime | None = None
    fecha_fin: datetime | None = None
    estado: str
    orden_sorteado: bool
    creador_id: UUID
    created_at: datetime
    participantes_count: int | None = None
    rondas_count: int | None = None
    num_rondas: int | None = None
    advertencia: str | None = None

    model_config = {"from_attributes": True}


class TandaDetailResponse(TandaResponse):
    participantes: list["ParticipantResponse"] = []
    rondas: list["RoundResponse"] = []


from app.schemas.participant import ParticipantResponse
from app.schemas.round import RoundResponse

TandaDetailResponse.model_rebuild()