from fastapi import APIRouter

from app.api.v1 import auth, users, entries, categories

router = APIRouter(prefix="/api/v1")

# Registro das rotas de API
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(entries.router)
router.include_router(categories.router)
