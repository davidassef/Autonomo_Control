from fastapi import FastAPI
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.user import User
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as api_router

app = FastAPI(
    title="Autônomo Control API",
    description="API para gestão financeira de profissionais autônomos",
    version="0.1.0"
)

# Configuração CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Create React App
        "http://localhost:5173",  # Vite
        "http://127.0.0.1:3000",  # Create React App (127.0.0.1)
        "http://127.0.0.1:5173"   # Vite (127.0.0.1)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Bem-vindo à API do Autônomo Control"}


# Registro das rotas da API
app.include_router(api_router)


def bootstrap_master():
    """Ensure MASTER user exists or is promoted based on MASTER_EMAIL env variable."""
    if not settings.MASTER_EMAIL:
        return
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == settings.MASTER_EMAIL).first()
        if user:
            changed = False
            if getattr(user, 'role', 'USER') != 'MASTER':
                user.role = 'MASTER'  # type: ignore[assignment]
                changed = True
            # Se existir MASTER_PASSWORD e usuário não tem hashed_password ainda, definir
            if settings.MASTER_PASSWORD and not getattr(user, 'hashed_password', None):
                user.hashed_password = get_password_hash(settings.MASTER_PASSWORD)  # type: ignore[assignment]
                changed = True
            if changed:
                db.commit()
        else:
            new_user = User(
                email=settings.MASTER_EMAIL,
                name='Master',
                role='MASTER',
                is_active=True,  # type: ignore[arg-type]
                hashed_password=get_password_hash(settings.MASTER_PASSWORD) if settings.MASTER_PASSWORD else None
            )
            db.add(new_user)
            db.commit()

        # Backfill global: garantir que nenhum usuário permaneça com role NULL
        null_role_users = db.query(User).filter((User.role == None)).all()  # noqa: E711
        updated = 0
        for u in null_role_users:
            u.role = 'USER'  # type: ignore[assignment]
            updated += 1
        if updated:
            db.commit()
    finally:
        db.close()


@app.on_event("startup")
def _on_startup():
    bootstrap_master()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
