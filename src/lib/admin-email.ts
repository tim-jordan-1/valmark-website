import { ADMIN_EMAIL } from 'astro:env/server';
import { requireAdminEmail } from './require-admin-email';

// ponytail: read at call time, not module load — an unset var should fail the
// request loudly, not break the build or take down every route on cold start.
export function adminEmail(): string {
  return requireAdminEmail(ADMIN_EMAIL);
}
