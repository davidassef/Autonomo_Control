from pydantic import BaseModel, Field
from typing import Optional, Generic, TypeVar, Any, List, Dict

T = TypeVar("T")


class ResponseBase(BaseModel):
    success: bool = True
    message: str = "Operação realizada com sucesso"


class SingleResponse(ResponseBase, Generic[T]):
    data: Optional[T] = None


class ListResponse(ResponseBase, Generic[T]):
    data: List[T] = []
    total: int = 0
    page: int = 1
    page_size: int = 10


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
