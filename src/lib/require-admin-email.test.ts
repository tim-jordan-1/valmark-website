// ponytail: one check for the only branch that can take the form down silently.
// Run: npx tsx src/lib/require-admin-email.test.ts
import assert from 'node:assert/strict';
import { requireAdminEmail } from './require-admin-email';

assert.throws(() => requireAdminEmail(undefined), /ADMIN_EMAIL is not set/);
assert.throws(() => requireAdminEmail(''), /ADMIN_EMAIL is not set/);
assert.equal(requireAdminEmail('someone@valmark.com.au'), 'someone@valmark.com.au');

console.log('ok');
