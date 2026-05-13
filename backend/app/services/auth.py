from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import TokenResponse, UserResponse


async def register_user(db: AsyncSession, email: str, nombre: str, password: str, telefono: str | None = None) -> TokenResponse:
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise ValueError("El email ya está registrado")

    user = User(email=email, nombre=nombre, telefono=telefono, password_hash=hash_password(password))
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


async def login_user(db: AsyncSession, email: str, password: str) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise ValueError("Email o contraseña incorrectos")

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
