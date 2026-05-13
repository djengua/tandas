from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, tandas, participants, rounds, payments, reports, users

app = FastAPI(title="Tandas API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(tandas.router, prefix="/api/tandas", tags=["Tandas"])
app.include_router(participants.router, prefix="/api/tandas", tags=["Participantes"])
app.include_router(rounds.router, prefix="/api/tandas", tags=["Rondas"])
app.include_router(payments.router, prefix="/api/tandas", tags=["Pagos"])
app.include_router(reports.router, prefix="/api/tandas", tags=["Reportes"])
app.include_router(users.router, prefix="/api/users", tags=["Usuarios"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
