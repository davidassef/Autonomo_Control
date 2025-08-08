from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.dependencies import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category_schema import Category as CategorySchema, CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categorias"])

@router.post("/", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cria uma nova categoria personalizada para o usuário
    """
    # Verificar se já existe uma categoria com o mesmo nome e tipo para o usuário
    existing_category = db.query(Category).filter(
        Category.name == category.name,
        Category.type == category.type,
        Category.user_id == current_user.id
    ).first()

    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma categoria com este nome e tipo"
        )

    db_category = Category(
        **category.model_dump(),
        user_id=current_user.id,
        is_default=False,
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/", response_model=List[CategorySchema])
async def read_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    category_type: Optional[str] = None,
):
    """
    Retorna todas as categorias disponíveis para o usuário
    (categorias padrão do sistema + categorias personalizadas do usuário)
    """
    # Buscar categorias padrão do sistema e categorias personalizadas do usuário
    query = db.query(Category).filter(
        (Category.is_default == True) | (Category.user_id == current_user.id)
    )

    # Filtrar por tipo de categoria se fornecido
    if category_type:
        query = query.filter(Category.type == category_type)

    return query.all()

@router.get("/{category_id}", response_model=CategorySchema)
async def read_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna uma categoria específica
    """
    db_category = db.query(Category).filter(
        Category.id == category_id,
        (Category.is_default == True) | (Category.user_id == current_user.id),
    ).first()

    if db_category is None:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    return db_category

@router.get("/{category_id}/subcategories", response_model=List[str])
async def get_category_subcategories(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna a lista de subcategorias de uma categoria específica
    """
    db_category = db.query(Category).filter(
        Category.id == category_id,
        (Category.is_default == True) | (Category.user_id == current_user.id)
    ).first()

    if db_category is None:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    return db_category.subcategories or []

@router.put("/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: str,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Atualiza uma categoria personalizada do usuário
    """
    db_category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id,  # Apenas categorias do usuário podem ser atualizadas
        Category.is_default.is_(False),  # Categorias padrão não podem ser atualizadas
    ).first()

    if db_category is None:
        raise HTTPException(
            status_code=404,
            detail="Categoria não encontrada ou não pode ser atualizada"
        )

    update_data = category_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)

    return db_category

@router.patch("/{category_id}", response_model=CategorySchema)
async def patch_category(
    category_id: str,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Atualiza parcialmente uma categoria personalizada do usuário (PATCH)
    """
    db_category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id,  # Apenas categorias do usuário podem ser atualizadas
        Category.is_default.is_(False),  # Categorias padrão não podem ser atualizadas
    ).first()

    if db_category is None:
        raise HTTPException(
            status_code=404,
            detail="Categoria não encontrada ou não pode ser atualizada"
        )

    update_data = category_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)

    return db_category

@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
async def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Remove uma categoria personalizada do usuário
    """
    db_category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id,  # Apenas categorias do usuário podem ser removidas
        Category.is_default.is_(False),  # Categorias padrão não podem ser removidas
    ).first()

    if db_category is None:
        raise HTTPException(
            status_code=404,
            detail="Categoria não encontrada ou não pode ser removida"
        )

    db.delete(db_category)
    db.commit()

    return {"message": "Categoria removida com sucesso"}
