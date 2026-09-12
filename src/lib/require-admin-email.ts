export function requireAdminEmail(value: string | undefined): string {
  if (!value) {
    throw new Error(
      'ADMIN_EMAIL is not set. Inquiry notifications have nowhere to go.',
    );
  }
  return value;
}
