// ponytail: one check for the only branch that can take the form down silently.
// Run: npx tsx src/lib/admin-email.test.ts
import assert from 'node:assert/strict';
import { adminEmail } from './admin-email';

delete process.env.ADMIN_EMAIL;
assert.throws(adminEmail, /ADMIN_EMAIL is not set/);

process.env.ADMIN_EMAIL = '';
assert.throws(adminEmail, /ADMIN_EMAIL is not set/);

process.env.ADMIN_EMAIL = 'someone@valmark.com.au';
assert.equal(adminEmail(), 'someone@valmark.com.au');

console.log('ok');
