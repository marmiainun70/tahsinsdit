export const getRoleLabel = (role: string | null | undefined) => {
  if (!role) return "-";
  const normalizedRole = role.trim().toLowerCase();
  if (normalizedRole === "admin") return "Admin";
  if (normalizedRole === "parent") return "Orang Tua";
  if (isTeacherRole(normalizedRole)) return "Guru Tahsin & Tahfizh";
  return role;
};

export const isTeacherRole = (role: string | null | undefined) => {
  if (!role) return false;
  const normalizedRole = role.trim().toLowerCase();
  if (!normalizedRole) return false;
  return normalizedRole !== "admin" && normalizedRole !== "parent";
};
