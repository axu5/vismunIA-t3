import type { UserRole } from "@prisma/client";

const checkRoles = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.some((allowedRole) => allowedRole === userRole);
};

export default checkRoles;
