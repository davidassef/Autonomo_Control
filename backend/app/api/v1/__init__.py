from fastapi import APIRouter

from app.api.v1 import (
    auth,
    users,
    entries,
    categories,
    admin_users,
    audit_logs,
    system_reports,
    secret_keys,
    cep,
    profile,
)
from app.routes import system_config

router = APIRouter(prefix="/api/v1")

# Registro das rotas de API
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(entries.router)
router.include_router(categories.router)
router.include_router(admin_users.router)
router.include_router(audit_logs.router)
router.include_router(system_reports.router)
router.include_router(secret_keys.router)
router.include_router(cep.router, prefix="/cep", tags=["cep"])
router.include_router(profile.router, prefix="/profile", tags=["profile"])
router.include_router(system_config.router)
