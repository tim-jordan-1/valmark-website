// Regression check: Astro maps a present-but-empty form field to null unless the
// outermost validator is ZodOptional. A blank message/honeypot must still validate.
// Run: node src/actions/schema.test.mjs
import assert from 'node:assert/strict';
import { z } from 'astro/zod';
import { SERVICE_NAMES } from '../data/services.ts';

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  service: z.enum(SERVICE_NAMES),
  message: z.string().max(5000).nullish(),
  source: z.enum(['lead-form', 'contact-form']).nullish(),
  honeypot: z.string().max(0).nullish(),
});

const base = {
  name: 'Jane',
  email: 'j@example.com',
  phone: '0400000000',
  service: SERVICE_NAMES[0],
};

// What Astro actually hands the action when the fields are blank.
assert.ok(schema.safeParse({ ...base, message: null, source: null, honeypot: null }).success);
assert.ok(schema.safeParse({ ...base, message: 'hi', source: 'contact-form', honeypot: null }).success);
// A bot filling the honeypot is still rejected.
assert.equal(schema.safeParse({ ...base, honeypot: 'spam' }).success, false);

console.log('ok');
