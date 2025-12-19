import { UserRoles } from "enums/roles.enum";

// middlewares/checkRole.ts
export function checkRole(userRole: UserRoles | undefined, allowed: UserRoles[]): boolean {
  if (!userRole) return false;

  return allowed.includes(userRole);
}
