import type { UserRole } from '../../generated/prisma/enums';

export interface AuthUser {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
  producerId: string | null;
  cooperativeId: string | null;
  // Demo visit the account belongs to; absent or null for real accounts.
  demoSessionId?: string | null;
}
