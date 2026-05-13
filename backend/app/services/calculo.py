from datetime import datetime, timedelta

PERIOD_DAYS = {
    "semanal": 7,
    "quincenal": 15,
    "mensual": 30,
}


def calcular_numero_rondas(fecha_inicio: datetime, fecha_fin: datetime, tipo_periodo: str) -> int:
    days = (fecha_fin - fecha_inicio).days
    if days < 1:
        return 2
    period_days = PERIOD_DAYS.get(tipo_periodo, 7)
    return max(days // period_days + 1, 2)


def calcular_numero_participantes(fecha_inicio: datetime, fecha_fin: datetime, tipo_periodo: str) -> int:
    return calcular_numero_rondas(fecha_inicio, fecha_fin, tipo_periodo)


def ajustar_fecha_fin(fecha_inicio: datetime, num_rondas: int, tipo_periodo: str) -> datetime:
    period_days = PERIOD_DAYS.get(tipo_periodo, 7)
    return fecha_inicio + timedelta(days=period_days * (num_rondas - 1))