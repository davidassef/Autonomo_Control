import React from "react";
import { AdminUser } from "../../services/adminUsers";

export const RoleBadge: React.FC<{ role: AdminUser["role"] }> = ({ role }) => {
  const cls =
    role === "MASTER"
      ? "bg-purple-100 text-purple-700"
      : role === "ADMIN"
        ? "bg-amber-100 text-amber-700"
        : "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>
      {role}
    </span>
  );
};
