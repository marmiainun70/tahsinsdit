export const getRoleLabel = (role: any) => {
  if (!role) return "-";
  if (Array.isArray(role)) {
    return role.map(r => getRoleLabel(r)).join(", ");
  }
  const normalizedRole = String(role).trim().toLowerCase();
  if (normalizedRole === "admin") return "Admin";
  if (normalizedRole === "parent") return "Orang Tua";
  if (isTeacherRole(normalizedRole)) return "Guru Tahsin & Tahfizh";
  return String(role);
};

export const isTeacherRole = (role: any): boolean => {
  if (!role) return false;
  if (Array.isArray(role)) {
    return role.some(r => isTeacherRole(r));
  }
  const normalizedRole = String(role).trim().toLowerCase();
  if (!normalizedRole) return false;
  return normalizedRole !== "admin" && normalizedRole !== "parent";
};
