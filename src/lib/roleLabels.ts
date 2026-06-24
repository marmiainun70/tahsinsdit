export const getRoleLabel = (role: string | null | undefined) => {
  if (!role) return "-";
  if (role === "admin") return "Admin";
  if (role === "parent") return "Orang Tua";
  if (role === "guru" || role === "penguji") return "Guru Tahsin & Tahfizh";
  return role;
};
