# Resend Email Integration

Email automation for the Valmark Waterproofing contact and inquiry forms using [Resend](https://resend.com) + Astro server endpoints, deployed on Cloudflare Workers.

## Overview

| Item | Detail |
|------|--------|
| **Service** | Resend (free tier: 100 emails/day, 3,000/month) |
| **Admin inbox** | admin@valmark.com.au |
| **Forms** | Home page lead form + Contact page form |
| **Stack** | Astro Action → Resend Node.js SDK → email |
| **Hosting** | Cloudflare Workers (via `@astrojs/cloudflare` adapter) |

### What happens when a visitor submits a form

1. Form POSTs to an Astro Action (`src/actions/index.ts`)
2. Server validates fields
3. Resend sends a **notification email** to `admin@valmark.com.au` with the inquiry details
4. Resend sends an **auto-reply** to the visitor confirming receipt
5. The page shows a success or error message

---

## Phase 1: Account & Project Setup

### Task 1.1 — Create a Resend account

- **Action**: Sign up at [resend.com](https://resend.com)
- **Files**: None
- **Complexity**: Small
- **Dependencies**: None

### Task 1.2 — Verify the sending domain

- **Action**: Add `valmark.com.au` as a domain in the Resend dashboard → Domains → Add Domain
- **DNS records to add** (Resend provides these after you add the domain):
  - `MX` record for receiving (optional)
  - `TXT` record for SPF
  - `CNAME` records for DKIM
  - `TXT` record for DMARC (recommended)
- **During development**: Use `onboarding@resend.dev` as the sender (Resend's test domain, works immediately with no DNS setup)
- **Files**: None (DNS changes at your domain registrar)
- **Complexity**: Small (but DNS propagation can take up to 48 hours)
- **Dependencies**: Task 1.1

### Task 1.3 — Generate an API key

- **Action**: Resend dashboard → API Keys → Create API Key
- **Permission**: "Sending access" for `valmark.com.au` only
- **Store the key**: You'll need it in the next task. It starts with `re_`
- **Files**: None
- **Complexity**: Small
- **Dependencies**: Task 1.1

### Task 1.4 — Configure environment variables

- **Files**: `.env` (local), Cloudflare dashboard (production)
- **Complexity**: Small
- **Dependencies**: Task 1.3

Create `.env` in the project root:

```env
RESEND_API_KEY=re_your_api_key_here
```

Add the same variable in Cloudflare:

```bash
# Via Wrangler CLI
wrangler secret put RESEND_API_KEY

# Or: Cloudflare Dashboard → Workers & Pages → Project → Settings → Environment Variables
```

Ensure `.env` is in `.gitignore` (it already is).

### Task 1.5 — Install the Resend SDK

- **Files**: `package.json`
- **Complexity**: Small
- **Dependencies**: Astro project must be initialised (see Astro refactor doc)

```bash
npm install resend
```

---

## Phase 2: Astro Server Configuration

### Task 2.1 — Install the Cloudflare adapter

- **Files**: `package.json`, `astro.config.mjs`
- **Complexity**: Small
- **Dependencies**: Astro project initialised

```bash
npx astro add cloudflare
```

This automatically installs `@astrojs/cloudflare` and updates `astro.config.mjs`.

### Task 2.2 — Configure hybrid rendering

The site is mostly static (marketing pages), but the form endpoint needs server-side rendering. Astro's hybrid mode handles this: pages are static by default, and individual endpoints opt out of prerendering.

- **Files**: `astro.config.mjs`
- **Complexity**: Small
- **Dependencies**: Task 2.1

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
  vite: {
    plugins: [tailwindcss()],
  },
});
```

> **Note**: With `output: 'static'`, individual routes opt into server rendering with `export const prerender = false;`. The Cloudflare adapter deploys these as Cloudflare Workers automatically.

### Task 2.3 — Configure environment variable schema (optional but recommended)

- **Files**: `astro.config.mjs` (add `env` block)
- **Complexity**: Small
- **Dependencies**: Task 2.2

```ts
// Inside defineConfig in astro.config.mjs
export default defineConfig({
  // ... existing config
  env: {
    schema: {
      RESEND_API_KEY: {
        context: 'server',
        access: 'secret',
        type: 'string',
      },
    },
  },
});
```

This lets you import the variable type-safely:

```ts
import { RESEND_API_KEY } from 'astro:env/server';
```

Alternatively, access it directly via `process.env.RESEND_API_KEY` (simpler, works without the schema).

---

## Phase 3: Email Templates

### Task 3.1 — Admin notification email template

When a visitor submits a form, `admin@valmark.com.au` receives an email with the inquiry details.

- **Files**: `src/lib/emails/inquiry-notification.ts`
- **Complexity**: Medium
- **Dependencies**: None (can be written independently)

```ts
// src/lib/emails/inquiry-notification.ts

export interface InquiryData {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  source: 'lead-form' | 'contact-form';
  timestamp: string;
}

export function inquiryNotificationHtml(data: InquiryData): string {
  return `
    <div style="font-family:'Roboto',Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
      <div style="background:#03334D;padding:24px 32px">
        <h1 style="color:#fff;font-size:20px;margin:0">New Inquiry — Valmark Waterproofing</h1>
      </div>
      <div style="padding:24px 32px;border:1px solid #e0e0e0;border-top:none">
        <table style="width:100%;border-collapse:collapse;font-size:15px">
          <tr>
            <td style="padding:10px 0;font-weight:700;width:120px;vertical-align:top">Name</td>
            <td style="padding:10px 0">${escapeHtml(data.name)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;vertical-align:top">Email</td>
            <td style="padding:10px 0"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;vertical-align:top">Phone</td>
            <td style="padding:10px 0"><a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;vertical-align:top">Service</td>
            <td style="padding:10px 0">${escapeHtml(data.service)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;vertical-align:top">Message</td>
            <td style="padding:10px 0">${escapeHtml(data.message)}</td>
          </tr>
        </table>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0">
        <p style="font-size:13px;color:#888">
          Source: ${data.source === 'lead-form' ? 'Home page quick enquiry' : 'Contact page form'}<br>
          Received: ${data.timestamp}
        </p>
      </div>
    </div>
  `;
}

export function inquiryNotificationText(data: InquiryData): string {
  return [
    `New Inquiry — Valmark Waterproofing`,
    ``,
    `Name:    ${data.name}`,
    `Email:   ${data.email}`,
    `Phone:   ${data.phone}`,
    `Service: ${data.service}`,
    `Message: ${data.message}`,
    ``,
    `Source: ${data.source === 'lead-form' ? 'Home page quick enquiry' : 'Contact page form'}`,
    `Received: ${data.timestamp}`,
  ].join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

### Task 3.2 — Customer auto-reply email template

The visitor receives a confirmation that their inquiry was received.

- **Files**: `src/lib/emails/inquiry-confirmation.ts`
- **Complexity**: Medium
- **Dependencies**: None

```ts
// src/lib/emails/inquiry-confirmation.ts

export function confirmationHtml(name: string): string {
  const firstName = name.split(' ')[0];
  return `
    <div style="font-family:'Roboto',Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
      <div style="background:#03334D;padding:24px 32px">
        <h1 style="color:#fff;font-size:20px;margin:0">Valmark Waterproofing</h1>
      </div>
      <div style="padding:24px 32px;border:1px solid #e0e0e0;border-top:none">
        <p style="font-size:16px;line-height:1.6">
          Hi ${escapeHtml(firstName)},
        </p>
        <p style="font-size:16px;line-height:1.6">
          Thanks for getting in touch. We've received your inquiry and a technician
          will call you back within one business hour.
        </p>
        <p style="font-size:16px;line-height:1.6">
          If your matter is urgent, call us directly on
          <a href="tel:0422878034" style="color:#1C9DD8;font-weight:700">0422 878 034</a>.
        </p>
        <p style="font-size:16px;line-height:1.6;margin-top:24px">
          Kind regards,<br>
          The Valmark Team
        </p>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
        <p style="font-size:12px;color:#888">
          Valmark Waterproofing · Melbourne, Victoria<br>
          <a href="mailto:admin@valmark.com.au" style="color:#888">admin@valmark.com.au</a>
        </p>
      </div>
    </div>
  `;
}

export function confirmationText(name: string): string {
  const firstName = name.split(' ')[0];
  return [
    `Hi ${firstName},`,
    ``,
    `Thanks for getting in touch. We've received your inquiry and a technician will call you back within one business hour.`,
    ``,
    `If your matter is urgent, call us directly on 0422 878 034.`,
    ``,
    `Kind regards,`,
    `The Valmark Team`,
    ``,
    `Valmark Waterproofing · Melbourne, Victoria`,
    `admin@valmark.com.au`,
  ].join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

---

## Phase 4: Server Endpoint / Astro Action

### Task 4.1 — Create the form handling action

This is the core of the integration. The Astro Action validates the form, sends both emails via Resend, and returns a result.

- **Files**: `src/actions/index.ts`
- **Complexity**: Large
- **Dependencies**: Tasks 1.5, 2.2, 3.1, 3.2

```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { Resend } from 'resend';
import {
  inquiryNotificationHtml,
  inquiryNotificationText,
  type InquiryData,
} from '../lib/emails/inquiry-notification';
import {
  confirmationHtml,
  confirmationText,
} from '../lib/emails/inquiry-confirmation';

const VALID_SERVICES = [
  'Bathrooms, ensuites and laundries',
  'Shower bases, niches and hobless showers',
  'Balconies, terraces and rooftops',
  'Retaining walls and planter boxes',
  'Waterproofing repairs and leak remediation',
  'Epoxy moisture barriers',
  'Moisture testing of concrete and screeds',
  'Substrate inspections',
  'Silicon and movement joint replacement',
] as const;

const inquirySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(6, 'Phone number is required').max(20),
  service: z.enum(VALID_SERVICES, {
    errorMap: () => ({ message: 'Please select a service' }),
  }),
  message: z.string().max(5000).optional().default(''),
  source: z.enum(['lead-form', 'contact-form']).optional().default('contact-form'),
  honeypot: z.string().max(0, 'Bot detected').optional().default(''),
});

export const server = {
  inquiry: defineAction({
    accept: 'form',
    input: inquirySchema,
    handler: async (input) => {
      // Honeypot check — bots fill hidden fields, humans don't
      if (input.honeypot) {
        // Silently succeed so bots don't know they were caught
        return { success: true };
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      const now = new Date();
      const timestamp = now.toLocaleString('en-AU', {
        timeZone: 'Australia/Melbourne',
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      const inquiryData: InquiryData = {
        name: input.name,
        email: input.email,
        phone: input.phone,
        service: input.service,
        message: input.message,
        source: input.source,
        timestamp,
      };

      // Send both emails concurrently
      const [notification, confirmation] = await Promise.allSettled([
        // 1. Notification to admin
        resend.emails.send({
          from: 'Valmark Website <noreply@valmark.com.au>',
          replyTo: input.email,
          to: ['admin@valmark.com.au'],
          subject: `New inquiry: ${input.service} — ${input.name}`,
          html: inquiryNotificationHtml(inquiryData),
          text: inquiryNotificationText(inquiryData),
        }),

        // 2. Auto-reply to customer
        resend.emails.send({
          from: 'Valmark Waterproofing <noreply@valmark.com.au>',
          to: [input.email],
          subject: "We've received your inquiry — Valmark Waterproofing",
          html: confirmationHtml(input.name),
          text: confirmationText(input.name),
        }),
      ]);

      // The admin notification is critical; the auto-reply is best-effort
      if (notification.status === 'rejected') {
        console.error('Failed to send admin notification:', notification.reason);
        throw new Error('Failed to send inquiry. Please try calling us on 0422 878 034.');
      }

      if (confirmation.status === 'rejected') {
        console.warn('Auto-reply failed (non-critical):', confirmation.reason);
      }

      return { success: true };
    },
  }),
};
```

### Task 4.2 — Shared validation constants

Extract the service list into a shared module so both the action and the frontend dropdown use the same source of truth.

- **Files**: `src/data/services.ts` (the service data file from the Astro refactor already has this — add the `VALID_SERVICES` export if not present)
- **Complexity**: Small
- **Dependencies**: None

```ts
// In src/data/services.ts (add this export)
export const SERVICE_NAMES = [
  'Bathrooms, ensuites and laundries',
  'Shower bases, niches and hobless showers',
  'Balconies, terraces and rooftops',
  'Retaining walls and planter boxes',
  'Waterproofing repairs and leak remediation',
  'Epoxy moisture barriers',
  'Moisture testing of concrete and screeds',
  'Substrate inspections',
  'Silicon and movement joint replacement',
] as const;
```

---

## Phase 5: Frontend Form Integration

### Task 5.1 — Create a reusable InquiryForm component

Both the home page lead form and the contact page form share the same fields and action. Create one component with a `source` prop to distinguish them.

- **Files**: `src/components/InquiryForm.astro`
- **Complexity**: Medium
- **Dependencies**: Task 4.1

```astro
---
// src/components/InquiryForm.astro
import { actions } from 'astro:actions';
import { SERVICE_NAMES } from '../data/services';

interface Props {
  source: 'lead-form' | 'contact-form';
  compact?: boolean; // true for the home page inline form
}

const { source, compact = false } = Astro.props;
const result = Astro.getActionResult(actions.inquiry);
const success = result && !result.error;
const error = result?.error;
---

{success ? (
  <div class="text-center py-8">
    <p class="text-lg font-bold text-[#03334D]">
      Thanks — a technician will call you back within one to two business days.
    </p>
  </div>
) : (
  <form method="POST" action={actions.inquiry}>
    <input type="hidden" name="source" value={source} />
    {/* Honeypot — hidden from humans, bots fill it */}
    <div class="absolute -left-[9999px]" aria-hidden="true">
      <input type="text" name="honeypot" tabindex="-1" autocomplete="off" />
    </div>

    <div class={compact
      ? 'grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5'
      : 'grid gap-4'
    }>
      <div class={compact ? '' : 'grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4'}>
        <label class="grid gap-1.5">
          {!compact && <span class="font-medium text-[15px]">Full name *</span>}
          <input
            required
            name="name"
            placeholder={compact ? 'Name*' : 'Jane Doe'}
            class="w-full border border-[#ccc] p-3.5 text-[15px] font-['Roboto',sans-serif]"
          />
        </label>
        <label class="grid gap-1.5">
          {!compact && <span class="font-medium text-[15px]">Email *</span>}
          <input
            required
            type="email"
            name="email"
            placeholder={compact ? 'Email Address*' : 'you@example.com'}
            class="w-full border border-[#ccc] p-3.5 text-[15px] font-['Roboto',sans-serif]"
          />
        </label>
      </div>
      <div class={compact ? '' : 'grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4'}>
        <label class="grid gap-1.5">
          {!compact && <span class="font-medium text-[15px]">Phone *</span>}
          <input
            required
            name="phone"
            inputmode="tel"
            placeholder={compact ? 'Phone No*' : 'Best contact number'}
            class="w-full border border-[#ccc] p-3.5 text-[15px] font-['Roboto',sans-serif]"
          />
        </label>
        <label class="grid gap-1.5">
          {!compact && <span class="font-medium text-[15px]">Service *</span>}
          <select
            required
            name="service"
            class="w-full border border-[#ccc] p-3.5 text-[15px] font-['Roboto',sans-serif] bg-white"
          >
            <option value="">Select Service*</option>
            {SERVICE_NAMES.map((s) => <option>{s}</option>)}
          </select>
        </label>
      </div>
      <label class={compact ? 'col-span-full grid gap-1.5' : 'grid gap-1.5'}>
        {!compact && <span class="font-medium text-[15px]">Message</span>}
        <textarea
          name="message"
          rows={compact ? 3 : 4}
          placeholder="Message"
          class="w-full border border-[#ccc] p-3.5 text-[15px] font-['Roboto',sans-serif] resize-y"
        ></textarea>
      </label>
      <div class={compact ? 'col-span-full text-center' : ''}>
        <button
          type="submit"
          class="bg-[#1C9DD8] text-white border-0 px-11 py-4 font-bold text-[15px] uppercase tracking-wider cursor-pointer font-['Roboto',sans-serif]"
        >
          {compact ? 'Enquiry Now' : 'Book your inspection today'}
        </button>
      </div>
    </div>

    {error && (
      <p class="text-red-600 text-sm mt-3 text-center">
        {error.message || 'Something went wrong. Please try calling us on 0422 878 034.'}
      </p>
    )}
  </form>
)}
```

### Task 5.2 — Add the form to the home page

- **Files**: `src/pages/index.astro`
- **Complexity**: Small
- **Dependencies**: Task 5.1

```astro
---
import InquiryForm from '../components/InquiryForm.astro';
---

<!-- In the quick-quote section of the home page -->
<section class="bg-white py-14">
  <div class="max-w-[1000px] mx-auto px-6">
    <div class="bg-white border border-[#e0e0e0] shadow-lg p-8">
      <h3 class="text-center font-bold text-[22px] text-[#03334D] mb-5">
        Get Your Free Quote Today
      </h3>
      <InquiryForm source="lead-form" compact />
    </div>
  </div>
</section>
```

### Task 5.3 — Add the form to the contact page

- **Files**: `src/pages/contact.astro`
- **Complexity**: Small
- **Dependencies**: Task 5.1

```astro
---
import InquiryForm from '../components/InquiryForm.astro';
---

<!-- In the contact page form section -->
<div class="bg-white border border-[#e0e0e0] shadow-lg p-8">
  <h2 class="font-bold text-[26px] text-[#03334D] mb-4">Get A Free Quote</h2>
  <InquiryForm source="contact-form" />
</div>
```

### Task 5.4 — Progressive enhancement with client-side JS (optional)

For a smoother UX, add a small script that submits the form via `fetch` instead of a full-page reload. The form still works without JS (standard POST).

- **Files**: `src/components/InquiryForm.astro` (add a `<script>` block)
- **Complexity**: Medium
- **Dependencies**: Task 5.1

```html
<script>
  document.querySelectorAll('form[action*="inquiry"]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
        });
        if (res.ok) {
          form.innerHTML = `<div class="text-center py-8">
            <p class="text-lg font-bold" style="color:#03334D">
              Thanks — a technician will call you back within one to two business days.
            </p>
          </div>`;
        } else {
          throw new Error('Server error');
        }
      } catch {
        btn.textContent = original;
        btn.disabled = false;
        const err = form.querySelector('.form-error') || document.createElement('p');
        err.className = 'form-error text-red-600 text-sm mt-3 text-center';
        err.textContent = 'Something went wrong. Please try calling us on 0422 878 034.';
        if (!err.parentNode) form.appendChild(err);
      }
    });
  });
</script>
```

---

## Phase 6: Testing & Deployment

### Task 6.1 — Local development testing

- **Complexity**: Small
- **Dependencies**: All Phase 1–5 tasks

```bash
# Start the Astro dev server
npm run dev

# The form will POST to the local Astro action
# Resend sends real emails even in dev (use your test API key)
```

**What to verify locally:**

- [ ] Form validation shows errors for missing fields
- [ ] Honeypot field is invisible to users
- [ ] Submitting with valid data shows success message
- [ ] Admin notification email arrives at `admin@valmark.com.au`
- [ ] Auto-reply email arrives at the test email address
- [ ] Email content renders correctly (check both HTML and plain text)
- [ ] `replyTo` on admin notification points to the customer's email

### Task 6.2 — Preview deployment testing

- **Complexity**: Small
- **Dependencies**: Task 6.1

```bash
# Deploy to Cloudflare Pages preview
npm run build && wrangler deploy

# Verify the RESEND_API_KEY environment variable is set
wrangler deployments list
```

**What to verify on preview:**

- [ ] Form submits successfully (serverless function works)
- [ ] Emails arrive within seconds
- [ ] No CORS or CSP errors in browser console
- [ ] Form works on mobile

### Task 6.3 — Production deployment

- **Complexity**: Small
- **Dependencies**: Task 6.2, domain verification (Task 1.2)

```bash
# Switch from onboarding@resend.dev to noreply@valmark.com.au
# (only after domain DNS records are verified)

# Deploy to production
npm run build && wrangler deploy
```

**What to verify in production:**

- [ ] Emails send from `noreply@valmark.com.au` (not `onboarding@resend.dev`)
- [ ] SPF, DKIM, DMARC all pass (check email headers)
- [ ] Resend dashboard shows deliveries under the `valmark.com.au` domain

### Task 6.4 — Monitor delivery

- **Action**: Check Resend dashboard periodically
- **Complexity**: Small (ongoing)
- **Key metrics**: Delivery rate, bounce rate, open rate (if tracking enabled)
- **Alert**: Set up Resend webhook or email alerts for bounces/failures (optional)

---

## Phase 7: Optional Enhancements

### Task 7.1 — Honeypot spam field

Already included in Task 4.1 and Task 5.1 above. The hidden `honeypot` input catches bots that auto-fill all fields. No CAPTCHA needed for a low-traffic trades website.

- **Files**: Already in `InquiryForm.astro` and `src/actions/index.ts`
- **Complexity**: Done (included in Phase 4/5)

### Task 7.2 — Rate limiting per IP

Prevent abuse by limiting submissions per IP address. Cloudflare Workers KV or a simple in-memory map works for low traffic.

- **Files**: `src/actions/index.ts` (add rate check before sending)
- **Complexity**: Medium
- **Dependencies**: Task 4.1

```ts
// Simple in-memory rate limiter (resets on cold start, fine for low traffic)
const submissions = new Map<string, number[]>();
const RATE_LIMIT = 5; // max submissions per IP
const RATE_WINDOW = 60 * 60 * 1000; // per hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const history = (submissions.get(ip) || []).filter((t) => now - t < RATE_WINDOW);
  if (history.length >= RATE_LIMIT) return false;
  history.push(now);
  submissions.set(ip, history);
  return true;
}
```

### Task 7.3 — Store submissions in Cloudflare Workers KV (optional)

If you want a record of all inquiries beyond the email inbox, store them in Cloudflare Workers KV (key-value store, free tier: 100,000 reads/day, 1,000 writes/day).

- **Files**: `src/actions/index.ts`, `wrangler.jsonc`
- **Complexity**: Medium
- **Dependencies**: Task 4.1

```ts
// Inside the action handler, after sending emails:
const { env } = await import("cloudflare:workers");
await env.INQUIRIES.put(
  crypto.randomUUID(),
  JSON.stringify({
    ...inquiryData,
    createdAt: now.toISOString(),
  })
);
```

---

## Task Dependency Graph

```
Phase 1 (Setup)
  1.1 Create account
  1.2 Verify domain ← 1.1
  1.3 Generate API key ← 1.1
  1.4 Configure env vars ← 1.3
  1.5 Install SDK ← Astro project exists

Phase 2 (Server config)
  2.1 Install Cloudflare adapter ← Astro project exists
  2.2 Configure hybrid rendering ← 2.1
  2.3 Env variable schema ← 2.2

Phase 3 (Templates) — no dependencies, can run in parallel
  3.1 Admin notification template
  3.2 Customer auto-reply template

Phase 4 (Action)
  4.1 Form handling action ← 1.5, 2.2, 3.1, 3.2
  4.2 Shared constants ← none

Phase 5 (Frontend)
  5.1 InquiryForm component ← 4.1
  5.2 Home page integration ← 5.1
  5.3 Contact page integration ← 5.1
  5.4 Client-side enhancement ← 5.1

Phase 6 (Testing)
  6.1 Local testing ← all above
  6.2 Preview deploy ← 6.1
  6.3 Production deploy ← 6.2, 1.2
  6.4 Monitor ← 6.3

Phase 7 (Optional)
  7.1 Honeypot ← done (in 4.1/5.1)
  7.2 Rate limiting ← 4.1
  7.3 Cloudflare Workers KV storage ← 4.1
```

## Subagent Assignment

| Agent | Tasks | Can start | Scope |
|-------|-------|-----------|-------|
| **Agent R1** | 3.1, 3.2 | Immediately | Email templates (HTML + plain text) |
| **Agent R2** | 4.1, 4.2 | After R1 | Astro Action + validation |
| **Agent R3** | 5.1, 5.2, 5.3, 5.4 | After R2 | Frontend form components |
| **Agent R4** | 6.1–6.4 | After R3 | Testing + deployment verification |

> **Note**: Phase 1 (account setup) and Phase 2 (Astro server config) are manual/config tasks done by the developer, not subagents. Phase 7 tasks are optional follow-ups.
