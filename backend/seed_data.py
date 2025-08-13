"""Seed script para categorias padrão e corridas fictícias.
Executar: python seed_data.py
"""
from datetime import datetime, timedelta, UTC
from random import choice, uniform, randint
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, Base, engine
from app.core.config import settings
from app.models.category import Category
from app.models.entry import Entry, EntryType
from app.models.user import User
from app.core.security import get_password_hash

DEFAULT_CATEGORIES = [
    ("Combustível", "EXPENSE"),
    ("Pedágio", "EXPENSE"),
    ("Manutenção", "EXPENSE"),
    ("Lavagem", "EXPENSE"),
    ("Taxa Plataforma", "EXPENSE"),
    ("Alimentação", "EXPENSE"),
    ("Seguro", "EXPENSE"),
    ("Depreciação", "EXPENSE"),
    ("Corrida", "INCOME"),
]

PLATFORMS = ["UBER", "99", "INDRIVE"]
SHIFTS = ["MANHA", "TARDE", "NOITE", "MADRUGADA"]
CITIES = ["São Paulo", "Campinas", "Santos"]


def get_or_create_system_user(db: Session) -> User:
    # Usar email válido para evitar problemas de validação
    system_email = "system@example.com"
    user = db.query(User).filter(User.email == system_email).first()
    if not user:
        user = User(email=system_email, name="Seed User", google_id="seed-user")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def seed_categories(db: Session, user: User):
    for name, ctype in DEFAULT_CATEGORIES:
        exists = db.query(Category).filter(Category.name == name, Category.user_id == user.id).first()
        if not exists:
            db.add(Category(name=name, type=ctype, user_id=user.id, is_default=True))
    db.commit()


def seed_sample_rides(db: Session, user: User, days: int = 10, per_day: int = 5):
    # Usar datetime.now(UTC) para evitar DeprecationWarning de utcnow()
    base_date = datetime.now(UTC).replace(hour=12, minute=0, second=0, microsecond=0)
    for d in range(days):
        day = base_date - timedelta(days=d)
        for _ in range(per_day):
            gross = round(uniform(8, 40), 2)
            fee = round(gross * uniform(0.15, 0.28), 2)
            tips = round(uniform(0, 5), 2)
            net = round(gross + tips - fee, 2)
            distance = round(uniform(2, 18), 2)
            duration = randint(5, 45)
            platform = choice(PLATFORMS)
            shift = choice(SHIFTS)
            city = choice(CITIES)
            entry = Entry(
                amount=net,
                description=f"Corrida {platform}",
                date=day - timedelta(minutes=randint(0, 600)),
                type=EntryType.INCOME,
                category="Corrida",
                user_id=user.id,
                platform=platform,
                distance_km=distance,
                duration_min=duration,
                gross_amount=gross,
                platform_fee=fee,
                tips_amount=tips,
                net_amount=net,
                shift_tag=shift,
                city=city,
            )
            db.add(entry)
    db.commit()


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Garantir MASTER via variáveis de ambiente, se configurado
        if settings.MASTER_EMAIL:
            master = db.query(User).filter(User.email == settings.MASTER_EMAIL).first()
            if not master:
                master = User(
                    email=settings.MASTER_EMAIL,
                    name="Master",
                    role="MASTER",
                    is_active=True,  # type: ignore[arg-type]
                    hashed_password=get_password_hash(settings.MASTER_PASSWORD) if settings.MASTER_PASSWORD else None
                )
                db.add(master)
                db.commit()
            else:
                changed = False
                if getattr(master, 'role', 'USER') != 'MASTER':
                    master.role = 'MASTER'  # type: ignore[assignment]
                    changed = True
                if settings.MASTER_PASSWORD and not getattr(master, 'hashed_password', None):
                    master.hashed_password = get_password_hash(settings.MASTER_PASSWORD)  # type: ignore[assignment]
                    changed = True
                if changed:
                    db.commit()
        user = get_or_create_system_user(db)
        seed_categories(db, user)
        seed_sample_rides(db, user)
        print("Seed concluído.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
