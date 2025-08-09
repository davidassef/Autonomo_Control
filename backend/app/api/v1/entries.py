from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import date, timedelta

from app.dependencies import get_current_user
from app.core.database import get_db
from app.models.entry import Entry, EntryType
from app.models.user import User
from app.schemas.entry_schema import (
    EntryInDB as EntrySchema, EntryCreate, EntryUpdate,
    EntrySummary, CategoryDistribution, CategoryDistributionList
)

router = APIRouter(prefix="/entries", tags=["lançamentos financeiros"])


@router.post("/", response_model=EntrySchema, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry: EntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cria um novo lançamento financeiro
    """
    data = entry.model_dump()
    # Se for uma corrida (INCOME com gross_amount) e net_amount não enviado, calcular
    if data.get('type') == 'INCOME':
        gross = data.get('gross_amount')
        fee = data.get('platform_fee') or 0
        tips = data.get('tips_amount') or 0
        if gross is not None and data.get('net_amount') is None:
            data['net_amount'] = (gross + tips) - fee
            # Se amount não fornecido explicitamente diferente do net, alinhar amount ao net
            if data.get('amount') == gross or data.get('amount') is None:
                data['amount'] = data['net_amount']
    db_entry = Entry(
        **data,
        user_id=current_user.id,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.get("/", response_model=List[EntrySchema])
async def read_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    type: Optional[str] = None,  # Alterado de entry_type para type para corresponder à URL
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    """
    Retorna os lançamentos financeiros do usuário com filtros opcionais
    """
    query = db.query(Entry).filter(
        Entry.user_id == current_user.id,
        Entry.is_deleted.is_(False),
    )

    # Aplicar filtros se fornecidos
    if start_date:
        query = query.filter(func.date(Entry.date) >= start_date)

    if end_date:
        query = query.filter(func.date(Entry.date) <= end_date)

    if type:
        query = query.filter(Entry.type == type)  # Alterado de entry_type para type

    if category:
        query = query.filter(Entry.category == category)

    if search:
        query = query.filter(
            or_(
                Entry.description.ilike(f"%{search}%"),
                Entry.category.ilike(f"%{search}%"),
                Entry.subcategory.ilike(f"%{search}%"),
            )
        )

    # Ordenar por data (mais recente primeiro)
    query = query.order_by(Entry.date.desc())

    return query.offset(skip).limit(limit).all()


@router.get("/summary", response_model=EntrySummary)
async def get_entries_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """
    Retorna um resumo dos lançamentos financeiros do usuário
    """
    query_filters = [
        Entry.user_id == current_user.id,
        Entry.is_deleted.is_(False),
    ]

    if start_date:
        query_filters.append(func.date(Entry.date) >= start_date)

    if end_date:
        query_filters.append(func.date(Entry.date) <= end_date)

    # Calcular total de receitas
    income_total = db.query(func.sum(Entry.amount)).filter(
        *query_filters,
        Entry.type == EntryType.INCOME
    ).scalar() or 0.0

    # Calcular total de despesas
    expense_total = db.query(func.sum(Entry.amount)).filter(
        *query_filters,
        Entry.type == EntryType.EXPENSE
    ).scalar() or 0.0

    # Calcular contagens
    income_count = db.query(Entry).filter(
        *query_filters,
        Entry.type == EntryType.INCOME
    ).count()

    expense_count = db.query(Entry).filter(
        *query_filters,
        Entry.type == EntryType.EXPENSE
    ).count()

    return EntrySummary(
        total_income=income_total,
        total_expense=expense_total,
        balance=income_total - expense_total,
        count_income=income_count,
        count_expense=expense_count,
        total_count=income_count + expense_count
    )


@router.get("/summary/monthly/{year}/{month}", response_model=EntrySummary)
async def get_monthly_summary(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna um resumo dos lançamentos financeiros do usuário para um mês específico
    """
    # Validate month
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Mês inválido")

    # Primeiro e último dia do mês
    if month == 12:
        start_date = date(year, month, 1)
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        start_date = date(year, month, 1)
        end_date = date(year, month + 1, 1) - timedelta(days=1)

    query_filters = [
        Entry.user_id == current_user.id,
        Entry.is_deleted.is_(False),
        func.date(Entry.date) >= start_date,
        func.date(Entry.date) <= end_date
    ]

    # Calcular total de receitas
    income_total = db.query(func.sum(Entry.amount)).filter(
        *query_filters,
        Entry.type == EntryType.INCOME
    ).scalar() or 0.0

    # Calcular total de despesas
    expense_total = db.query(func.sum(Entry.amount)).filter(
        *query_filters,
        Entry.type == EntryType.EXPENSE
    ).scalar() or 0.0

    # Calcular contagens
    income_count = db.query(Entry).filter(
        *query_filters,
        Entry.type == EntryType.INCOME
    ).count()

    expense_count = db.query(Entry).filter(
        *query_filters,
        Entry.type == EntryType.EXPENSE
    ).count()

    return EntrySummary(
        total_income=income_total,
        total_expense=expense_total,
        balance=income_total - expense_total,
        count_income=income_count,
        count_expense=expense_count,
        total_count=income_count + expense_count
    )

@router.get("/category-distribution", response_model=CategoryDistributionList)
async def get_category_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    type: Optional[str] = None,
):
    """
    Retorna a distribuição de lançamentos por categoria
    """
    query_filters = [
        Entry.user_id == current_user.id,
        Entry.is_deleted.is_(False),
    ]
    if start_date:
        query_filters.append(func.date(Entry.date) >= start_date)
    if end_date:
        query_filters.append(func.date(Entry.date) <= end_date)
    if type:
        query_filters.append(Entry.type == type)

    total = db.query(func.sum(Entry.amount)).filter(*query_filters).scalar() or 0.0
    category_data = db.query(
        Entry.category.label('category'),
        func.sum(Entry.amount).label('amount'),
        func.count(Entry.id).label('count')
    ).filter(
        *query_filters
    ).group_by(
        Entry.category
    ).order_by(
        func.sum(Entry.amount).desc()
    ).all()

    distributions = []
    for item in category_data:
        percentage = (item.amount / total * 100) if total > 0 else 0
        distributions.append(
            CategoryDistribution(
                category=item.category,
                category_name=item.category,  # Aqui pode-se buscar o nome real se necessário
                amount=item.amount,
                count=item.count,  # type: ignore
                percentage=percentage
            )
        )

    return CategoryDistributionList(
        distributions=distributions,
        total=total
    )


@router.get("/{entry_id}", response_model=EntrySchema)
async def read_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna um lançamento financeiro específico
    """
    db_entry = db.query(Entry).filter(
        Entry.id == entry_id,
        Entry.user_id == current_user.id,
        Entry.is_deleted.is_(False),
    ).first()

    if db_entry is None:
        raise HTTPException(status_code=404, detail="Lançamento não encontrado")

    return db_entry


@router.put("/{entry_id}", response_model=EntrySchema)
async def update_entry(
    entry_id: str,
    entry_update: EntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Atualiza um lançamento financeiro
    """
    db_entry = db.query(Entry).filter(
        Entry.id == entry_id,
        Entry.user_id == current_user.id,
        Entry.is_deleted.is_(False),
    ).first()

    if db_entry is None:
        raise HTTPException(status_code=404, detail="Lançamento não encontrado")

    update_data = entry_update.model_dump(exclude_unset=True)
    # Recalcular net_amount se campos relevantes alterados
    fields_trigger = {'gross_amount', 'platform_fee', 'tips_amount'}
    if fields_trigger.intersection(update_data.keys()) and db_entry.type == EntryType.INCOME:
        gross = update_data.get('gross_amount', getattr(db_entry, 'gross_amount', None))
        fee = update_data.get('platform_fee', getattr(db_entry, 'platform_fee', 0)) or 0
        tips = update_data.get('tips_amount', getattr(db_entry, 'tips_amount', 0)) or 0
        if gross is not None:
            update_data['net_amount'] = (gross + tips) - fee
            # Ajustar amount se parecer ser antigo bruto
            if 'amount' not in update_data and getattr(db_entry, 'amount', None) in (gross, None):
                update_data['amount'] = update_data['net_amount']
    for key, value in update_data.items():
        setattr(db_entry, key, value)

    db.commit()
    db.refresh(db_entry)

    return db_entry


@router.patch("/{entry_id}", response_model=EntrySchema)
async def update_entry_patch(
    entry_id: str,
    entry_update: EntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Atualiza parcialmente um lançamento financeiro
    """
    db_entry = db.query(Entry).filter(
        Entry.id == entry_id,
        Entry.user_id == current_user.id,
        Entry.is_deleted.is_(False),
    ).first()

    if db_entry is None:
        raise HTTPException(status_code=404, detail="Lançamento não encontrado")

    update_data = entry_update.model_dump(exclude_unset=True)
    fields_trigger = {'gross_amount', 'platform_fee', 'tips_amount'}
    if fields_trigger.intersection(update_data.keys()) and db_entry.type == EntryType.INCOME:
        gross = update_data.get('gross_amount', getattr(db_entry, 'gross_amount', None))
        fee = update_data.get('platform_fee', getattr(db_entry, 'platform_fee', 0)) or 0
        tips = update_data.get('tips_amount', getattr(db_entry, 'tips_amount', 0)) or 0
        if gross is not None:
            update_data['net_amount'] = (gross + tips) - fee
            if 'amount' not in update_data and getattr(db_entry, 'amount', None) in (gross, None):
                update_data['amount'] = update_data['net_amount']
    for key, value in update_data.items():
        setattr(db_entry, key, value)

    db.commit()
    db.refresh(db_entry)

    return db_entry


@router.delete("/{entry_id}", status_code=status.HTTP_200_OK)
async def delete_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marca um lançamento financeiro como excluído (soft delete)
    """
    db_entry = db.query(Entry).filter(
        Entry.id == entry_id,
        Entry.user_id == current_user.id,
        Entry.is_deleted.is_(False),
    ).first()

    if db_entry is None:
        raise HTTPException(status_code=404, detail="Lançamento não encontrado")

    # Soft delete
    db_entry.is_deleted = True  # type: ignore
    db.commit()

    return {"message": "Lançamento removido com sucesso"}
