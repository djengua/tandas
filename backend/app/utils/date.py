from datetime import datetime
from zoneinfo import ZoneInfo

MEXICO_TZ = ZoneInfo("America/Mexico_City")


def now_mexico() -> datetime:
    return datetime.now(MEXICO_TZ).replace(tzinfo=None)


def to_mexico_naive(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(MEXICO_TZ).replace(tzinfo=None)
    return dt
