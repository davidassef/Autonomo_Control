from app.core.config import settings
from app.models.user import User


def is_original_master(user: User) -> bool:
    """
    Verifica se o usuário é o Master original do sistema.

    O Master original é identificado pelo email configurado na variável
    de ambiente MASTER_EMAIL e deve ter role MASTER.

    Args:
        user: Instância do modelo User

    Returns:
        bool: True se for o Master original, False caso contrário
    """
    if not settings.MASTER_EMAIL:
        return False

    return user.email == settings.MASTER_EMAIL and str(user.role) == "MASTER"


def can_delete_user(target_user: User, current_user: User) -> tuple[bool, str]:
    """
    Verifica se um usuário pode ser excluído.

    Args:
        target_user: Usuário que será excluído
        current_user: Usuário que está tentando excluir

    Returns:
        tuple[bool, str]: (pode_excluir, mensagem_erro)
    """
    # Não permitir auto-exclusão
    if target_user.id == current_user.id:
        return False, "Não é possível excluir sua própria conta"

    # Proteger o Master original do sistema
    if is_original_master(target_user):
        return False, "Não é possível excluir o Master original do sistema"

    # Não permitir exclusão de outros MASTERs (exceto o original já verificado acima)
    if str(target_user.role) == "MASTER":
        return False, "Não é possível excluir conta MASTER"

    # ADMIN só pode excluir usuários USER
    if str(current_user.role) == "ADMIN" and str(target_user.role) == "ADMIN":
        return False, "ADMIN não pode excluir outro ADMIN"

    return True, ""


def can_disable_user(target_user: User, current_user: User) -> tuple[bool, str]:
    """
    Verifica se um usuário pode ser desabilitado.

    Args:
        target_user: Usuário que será desabilitado
        current_user: Usuário que está tentando desabilitar

    Returns:
        tuple[bool, str]: (pode_desabilitar, mensagem_erro)
    """
    # Proteger o Master original do sistema
    if is_original_master(target_user):
        return False, "Não é possível desabilitar o Master original do sistema"

    # Não permitir desabilitação de MASTERs (exceto o original já verificado acima)
    if str(target_user.role) == "MASTER":
        return False, "Não desativar MASTER"

    # ADMIN não pode desabilitar outro ADMIN
    if str(current_user.role) == "ADMIN" and str(target_user.role) == "ADMIN":
        return False, "ADMIN não desativa ADMIN"

    return True, ""


def can_block_user(target_user: User, current_user: User) -> tuple[bool, str]:
    """
    Verifica se um usuário pode ser bloqueado.

    Args:
        target_user: Usuário que será bloqueado
        current_user: Usuário que está tentando bloquear

    Returns:
        tuple[bool, str]: (pode_bloquear, mensagem_erro)
    """
    # Proteger o Master original do sistema
    if is_original_master(target_user):
        return False, "Não é possível bloquear o Master original do sistema"

    # Não permitir bloqueio de MASTERs (exceto o original já verificado acima)
    if str(target_user.role) == "MASTER":
        return False, "Não é possível bloquear o MASTER"

    # ADMIN não pode bloquear outro ADMIN
    if str(current_user.role) == "ADMIN" and str(target_user.role) == "ADMIN":
        return False, "ADMIN não pode bloquear outro ADMIN"

    return True, ""
