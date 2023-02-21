import type { UserRole } from "@prisma/client";

const checkRoles = (role: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.some((allowedRole) => allowedRole === role);
};

export default checkRoles;
