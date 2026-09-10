# ChatGPT Sites Migration Plan

> **Superseded:** This document explored a ChatGPT Sites migration path. The site was migrated to **Cloudflare Pages** instead (Sep 2026). See `CLAUDE.md` for current architecture.

Plan for moving the Valmark Waterproofing site off Vercel and onto [ChatGPT Sites](https://learn.chatgpt.com/docs/sites), OpenAI's hosted website product.

## Overview

| Item | Detail |
|------|--------|
| **Target platform** | ChatGPT Sites (public beta) |
| **Runtime** | Cloudflare Workers edge runtime |
| **Required build output** | Cloudflare Worker-compatible ES modules |
| **Storage available** | D1 (SQLite, 10 GB cap), R2 object storage |
| **Adapter change** | `@astrojs/vercel` → `@astrojs/cloudflare@12.6.10` (pinned — see [Version ceiling](#1-version-ceiling)) |
| **Estimated effort** | 3–5 hours |
| **Feasibility** | Confirmed — build verified against a Workers target |
| **Recommendation** | **Do not migrate yet.** See [Why this is on hold](#why-this-is-on-hold). |

## Status: investigated, not started

This document records a feasibility investigation, not work in progress. The build was verified in a scratch copy of the repo; **no changes have been made to the project**. Read [Why this is on hold](#why-this-is-on-hold) before starting.

---

## What was verified

These aren't assumptions — each was tested against this codebase.

| Claim | How it was verified | Result |
|-------|--------------------|--------|
| Astro builds for a Workers target | Swapped adapter in a scratch clone, ran `astro build` | ✅ Emits `dist/_worker.js/index.js` as an ES module; all 9 service pages prerender, both on-demand routes preserved |
| Resend SDK runs on Workers | Grepped `node_modules/resend/dist/` for Node builtin imports | ✅ None — pure `fetch`. Same for `standardwebhooks` (used by `resend-webhook.ts`) |
| `process.env` port works | Applied `getSecret()` changes in the scratch clone, rebuilt | ✅ Clean build |
| Latest Cloudflare adapter is usable | `npm install @astrojs/cloudflare` | ❌ Fails — requires `astro ^7.2.0`, project is on `5.18.2` |

---

## Required code changes

### 1. `process.env` → `astro:env/server` (the critical one)

**`process.env` does not exist on Cloudflare Workers.** Worse, the adapter's build output opens with:

```js
globalThis.process ??= {}; globalThis.process.env ??= {};
```

So `process.env.RESEND_API_KEY` doesn't throw — it silently reads `undefined`. Resend then fails with `Missing API key`, and the visitor sees *"Something went wrong. Please try calling us on 0422 878 034."*

**That is the same generic failure signature as the two production bugs documented in `CLAUDE.md`.** Do this change first, and verify a real submission before trusting anything else.

The Cloudflare adapter wires the Workers env into Astro's `getSecret` (via `setGetEnv`), not into `process.env`. The `env.schema` is already declared in `astro.config.mjs`, so this is mechanical:

| File | Line | Current | Replace with |
|------|------|---------|--------------|
| `src/actions/index.ts` | 32 | `process.env.RESEND_DOMAIN_VERIFIED` | `getSecret('RESEND_DOMAIN_VERIFIED')` |
| `src/actions/index.ts` | 68 | `process.env.RESEND_API_KEY` | `getSecret('RESEND_API_KEY')` |
| `src/actions/index.ts` | 115 | `process.env.KV_REST_API_URL` | `getSecret('KV_REST_API_URL')` |
| `src/lib/admin-email.ts` | 4 | `process.env.ADMIN_EMAIL` | `getSecret('ADMIN_EMAIL')` |

```ts
import { getSecret } from 'astro:env/server';
```

**Move module-scope reads inside the handler.** `SENDER_DOMAIN`, `NOTIFICATION_FROM`, and `CONFIRMATION_FROM` (`src/actions/index.ts:32-36`) are evaluated at module load. Worker env is request-scoped, so convert them to functions:

```ts
const senderDomain = () =>
  getSecret('RESEND_DOMAIN_VERIFIED') === 'true' ? 'valmark.com.au' : 'resend.dev';
const notificationFrom = () => `Valmark Website <noreply@${senderDomain()}>`;
```

> This change is **adapter-agnostic** — it works on Vercel today. Worth doing regardless of whether the migration proceeds, since it removes a silent-failure class from the code. `docs/RESEND-EMAIL-INTEGRATION.md` already assumed `astro:env/server`; the implementation drifted to `process.env`.

### 2. `ADMIN_EMAIL` → `access: 'secret'`

In `astro.config.mjs`, `ADMIN_EMAIL` is `access: 'public'`, so Astro validates and inlines it at **build** time — the build fails outright without it. Change to `access: 'secret'` so it resolves at runtime from Sites' hosted secrets.

Confirmed during testing: the build fails with `EnvInvalidVariables — ADMIN_EMAIL is missing` until the value is supplied.

### 3. Adapter swap

```diff
-import vercel from '@astrojs/vercel';
+import cloudflare from '@astrojs/cloudflare';

-  adapter: vercel(),
+  adapter: cloudflare(),
```

```bash
npm uninstall @astrojs/vercel
npm install @astrojs/cloudflare@12.6.10   # pinned — see Version ceiling
```

### 4. `security.allowedDomains`

The allowlist in `astro.config.mjs` exists because Astro's `checkOrigin` middleware 403s every form POST when it can't trust `X-Forwarded-Host` (see `CLAUDE.md`). **This is still required on Sites** — the mechanism is the same behind any proxy. Update the patterns to cover the Sites-issued domain and the custom domain:

```js
security: {
  allowedDomains: [
    { hostname: 'valmark.com.au', protocol: 'https' },
    { hostname: '**.valmark.com.au', protocol: 'https' },
    // + whatever hostname Sites issues
  ],
},
```

Getting this wrong reproduces the `403 Cross-site POST form submissions are forbidden` bug exactly.

### 5. `vercel.json` → Workers equivalent

`vercel.json` only sets `Cache-Control: immutable` on `/uploads/*` and `*.js`. Vercel-specific — port to the Sites/Workers asset config or set the headers in middleware. Low risk; worst case is weaker caching.

### 6. `@vercel/kv` — drop or port to D1

The only dependency with no path forward. It's already best-effort and gated on `KV_REST_API_URL` (`src/actions/index.ts:114-124`), wrapped in try/catch, and its failure is non-fatal.

- **Drop it** (recommended): delete ~10 lines. You lose the stored inquiry log; emails are unaffected.
- **Port to D1**: Sites provisions D1 natively and records the binding in `.openai/hosting.json`. More work, arguably better than the current setup.

### 7. Tests

`src/lib/admin-email.test.ts` sets `process.env.ADMIN_EMAIL` directly. Rewrite against `getSecret`, or drop the env-specific cases. `src/actions/schema.test.mjs` is pure Zod and needs no change.

---

## Effort

| Task | Estimate |
|------|----------|
| `process.env` → `getSecret` (4 call sites, 2 files) | 20 min |
| `ADMIN_EMAIL` → `access: 'secret'` | 2 min |
| Adapter swap + `package.json` | 10 min |
| `vercel.json` → Workers headers | 30 min |
| Drop or port `@vercel/kv` | 30 min – 2 hr |
| Update `security.allowedDomains` | 10 min |
| Fix `admin-email.test.ts` | 15 min |
| Set hosted secrets, DNS cutover, end-to-end retest | 1–2 hr |
| **Total** | **3–5 hours** |

Small, because the site is mostly static and the only backend is a single Astro Action.

---

## Deployment workflow (this changes)

Sites has **no standalone Codex CLI management view**. Deploys are driven from the ChatGPT web or desktop app:

1. Ask ChatGPT to check compatibility and deploy the local project.
2. ChatGPT builds a version and associates it with a git commit.
3. Two-stage publish: **save** a version (reviewable candidate), then **deploy** it to production.
4. Secrets are managed in Site settings; after changing one, **redeploy the saved version**.

`.openai/hosting.json` stores the project linkage and storage binding names:

```json
{ "project_id": "<project-id>", "d1": "DB", "r2": null }
```

Never put secret values in this file — it's committed to the repo.

**What you lose:** `npx vercel --prod --yes`, git-push-to-deploy, and any CI-driven deploy.

---

## Why this is on hold

The code work is small and low-risk. The platform is the problem.

### 1. Version ceiling

`@astrojs/cloudflare@14.3.1` (latest) requires `astro ^7.2.0`. This project is on **5.18.2**, so the install fails outright:

```
npm error peer astro@"^7.2.0" from @astrojs/cloudflare@14.3.1
```

You must pin `12.6.10` (peer `^5.7.0`) — verified working — or take on an Astro 5 → 7 two-major upgrade. Pinning works today but parks the project on a stale adapter line while `@astrojs/vercel` stays current.

### 2. No CLI deploy

Deployment through a chat UI is a real daily-workflow regression for a site under active development, and rules out CI.

### 3. Public beta, no SLA

No published bandwidth or request limits, no uptime commitment. The contact form is this site's entire commercial purpose.

### 4. No gain

Sites' selling points are D1, R2, built-in auth, and chat-driven iteration. This site uses none of them. The migration trades a mature deploy pipeline for a beta one and adds no capability.

### Non-blockers, for the record

- **Custom domains** are supported — needed for `valmark.com.au`. (Not available in Enterprise workspaces at launch; irrelevant here.)
- **Regional availability** — Sites is unavailable in the EEA, Switzerland, and the UK. An Australian account is fine.
- **Usage policy** — Sites must not process payment-card data or PHI. This site does neither.
- **Outbound HTTPS** is supported, so Resend works. Raw TCP is not, which Resend doesn't need.

---

## If cost is the actual motive

ChatGPT Sites is the wrong lever. See the comparison recorded during this investigation:

- **Vercel Hobby is not an option** — the [fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage) restrict it to non-commercial, personal use, and Vercel explicitly counts lead-generation and service-advertising sites as commercial. Usage limits would be fine; the licence is not.
- **Cloudflare Workers free tier** permits commercial use, allows 100k requests/day, and needs *the same code changes as this plan* — but keeps a real CLI (`wrangler deploy`), git integration, and an SLA. If the goal is $0 hosting, this is the better destination.
- **Vercel Pro** is $20/month and needs zero work.

Resend's own free tier (3,000 emails/month, 100/day) covers this site's volume regardless of host.

---

## Recommended order of work, if it proceeds

1. Port `process.env` → `getSecret` **on Vercel first** and verify a real form submission. Adapter-agnostic, de-risks the migration, valuable on its own.
2. Branch. Swap the adapter, pin `12.6.10`, get a clean `astro build`.
3. Decide KV: drop or port to D1.
4. Link the Sites project, set hosted secrets, deploy to the Sites-issued URL.
5. Update `security.allowedDomains` for the new hostname; **submit the form in a real browser** — `curl` cannot reproduce the two known form bugs (see `CLAUDE.md`).
6. Confirm the notification and auto-reply emails both arrive.
7. Only then cut `valmark.com.au` DNS over.

Keep the Vercel project alive until the Sites deployment has taken real enquiries.

---

## References

- [ChatGPT Sites docs](https://learn.chatgpt.com/docs/sites)
- [Creating and managing ChatGPT Sites](https://help.openai.com/en/articles/20001339-creating-and-managing-chatgpt-sites)
- [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Astro environment variables](https://docs.astro.build/en/guides/environment-variables/)
- `CLAUDE.md` → *Inquiry Form Submission* — the two Astro edge cases that will bite again during retest
