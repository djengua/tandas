from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.services.report import get_tanda_report, generate_csv_export, get_activities

router = APIRouter()


@router.get("/{tanda_id}/reportes")
async def report(tanda_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return await get_tanda_report(db, tanda_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{tanda_id}/reportes/actividades")
async def activities(tanda_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return await get_activities(db, tanda_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{tanda_id}/reportes/exportar.csv")
async def export_csv(tanda_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        csv_content = await generate_csv_export(db, tanda_id)
        return StreamingResponse(
            media_type="text/csv",
            content=csv_content,
            headers={"Content-Disposition": f"attachment; filename=reporte_tanda_{tanda_id}.csv"}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
