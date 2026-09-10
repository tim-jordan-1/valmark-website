// ponytail: read at call time, not module load — an unset var should fail the
// request loudly, not break the build or take down every route on cold start.
export function adminEmail(): string {
  const value = process.env.ADMIN_EMAIL;
  if (!value) {
    throw new Error(
      'ADMIN_EMAIL is not set. Inquiry notifications have nowhere to go.',
    );
  }
  return value;
}
