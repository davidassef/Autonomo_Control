import React from "react";
import { AdminUser } from "../../services/adminUsers";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  user: AdminUser;
  loading: boolean;
  onToggle: (user: AdminUser) => void;
  disabled?: boolean;
}

export const AdminVisibilityToggle: React.FC<Props> = ({
  user,
  loading,
  onToggle,
  disabled,
}) => {
  if (user.role !== "ADMIN") {
    return null;
  }

  const canView = user.can_view_admins || false;
  const Icon = canView ? Eye : EyeOff;
  const title = canView
    ? "Pode ver outros ADMINs"
    : "Não pode ver outros ADMINs";
  const buttonClass = canView
    ? "bg-green-100 text-green-700 hover:bg-green-200"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  return (
    <button
      type="button"
      onClick={() => onToggle(user)}
      disabled={disabled || loading}
      title={title}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonClass}`}
    >
      <Icon className="w-3 h-3" data-testid={canView ? "eye-icon" : "eye-off-icon"} />
    </button>
  );
};
