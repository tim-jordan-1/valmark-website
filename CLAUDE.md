# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A multi-page marketing website for **Valmark Waterproofing** (Victoria, Australia), built with **Astro** and **Tailwind CSS v4**. Static site deployed to Vercel — zero client-side JS except small interactive islands (slider, carousel, form handlers, gallery filter).

## Commands

```bash
npm run dev       # Start dev server at http://localhost:4321
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

## Architecture

Astro static site with Tailwind v4 via Vite plugin. No React — all interactivity is vanilla JS in `<script>` tags inside Astro components.

- **Pages**: `src/pages/` — file-based routing. `services/[id].astro` generates 9 static service detail pages via `getStaticPaths()`.
- **Layout**: `src/layouts/Base.astro` wraps every page (head, header, footer, mobile bar).
- **Components**: `src/components/` — Astro components, no framework needed.
- **Data**: `src/data/` — typed TypeScript exports (services, site config, team, gallery).
- **Styles**: `src/styles/global.css` — Tailwind v4 `@theme inline` block defines design tokens (colors, fonts, breakpoints).
- **Images**: `public/uploads/` — served at `/uploads/*`.

## File Layout

| Directory/File | Role |
|----------------|------|
| `src/pages/` | Astro pages (index, services, why, gallery, area, contact) |
| `src/pages/services/[id].astro` | Dynamic service detail (9 pages at build) |
| `src/components/` | Header, Footer, MobileBottomBar, BeforeAfterSlider, ImageCarousel, ProcessStep, InquiryForm |
| `src/actions/index.ts` | Astro Action handling inquiry form submissions |
| `src/lib/emails/` | Email HTML/text templates for notification + auto-reply |
| `src/data/` | services.ts, site.ts, team.ts, gallery.ts |
| `src/layouts/Base.astro` | Shared HTML shell |
| `src/styles/global.css` | Tailwind v4 theme tokens + base styles |
| `public/uploads/` | Static images |
| `astro.config.mjs` | Astro + Tailwind Vite plugin + Vercel adapter |
| `vercel.json` | Cache headers for uploads and JS assets |

## Interactive Islands (ship client JS)

- `BeforeAfterSlider.astro` — pointer-drag image comparison
- `ImageCarousel.astro` — auto-advancing image slideshow
- `Header.astro` — mobile menu toggle + scroll progress bar
- `gallery.astro` — filter chip click handler
- `area.astro` — postcode checker
- `InquiryForm.astro` — progressive-enhancement submit handler (see Inquiry Form below)

## Inquiry Form Submission

The only backend path in the site. Used on `/` and `/contact`, both of which set
`export const prerender = false` — Astro Actions need an on-demand route.

**Flow:** `InquiryForm.astro` → Astro Action `inquiry` (`src/actions/index.ts`) → Resend
(admin notification + customer auto-reply, via `Promise.allSettled`) → Vercel KV (best-effort).
Only a rejected *admin* notification fails the request; a failed auto-reply or KV write is logged
and swallowed.

The form works without JS (native POST re-renders the page via `Astro.getActionResult`). The
client script intercepts submit and `fetch`es the same URL, swapping in a success message on
`res.ok`.

Required env vars (set in Vercel for Preview + Production): `RESEND_API_KEY`, `ADMIN_EMAIL`.
`ADMIN_EMAIL` is read at call time and throws if unset. `RESEND_DOMAIN_VERIFIED=true` switches the
sender from `resend.dev` to `valmark.com.au`. KV vars are optional.

### Two edge cases that broke this in production

Both are Astro internals, both fail *before* the handler runs, and both surface to the user as the
same generic "Something went wrong" — so **read the actual response body before theorising**.
`InquiryForm.astro` now logs the real status and body to the console for this reason.

**1. Blank optional fields arrive as `null`, not `''`.**
`astro/dist/actions/runtime/server.js` (`handleFormDataGet`) maps a present-but-empty form field to
`null` unless the **outermost** validator is `ZodOptional`. `.optional().default('')` wraps it in
`ZodDefault`, so the check fails and Zod rejects with `Expected string, received null`. The
`.default('')` never applies either — defaults are only used when the field is *absent* from the
FormData.

The honeypot input is always rendered and always empty, so this 400'd every real submission.

```ts
message: z.string().max(5000).optional().default(''),  // ✗ null on blank
message: z.string().max(5000).nullish(),               // ✓ undefined on blank
```

Use `.nullish()` for any optional field backed by a real `<input>`, and coerce in the handler
(`input.message ?? ''`). Don't add `.transform()` — `ZodEffects` becomes the outermost type and
reintroduces the bug. Guarded by `src/actions/schema.test.mjs` (`npx tsx src/actions/schema.test.mjs`).

**2. `curl` cannot reproduce either bug.** Omitting `honeypot` entirely takes the working
(field-absent) path. Reproduce with a real browser — Playwright — and read the network response.

**3. `security.allowedDomains` is required on Vercel.**
Astro's `checkOrigin` middleware compares the `Origin` header to `Astro.url.origin`. Astro ignores
`X-Forwarded-Host` unless `security.allowedDomains` is configured, so behind Vercel's proxy the host
falls back to the literal `localhost`, no browser origin ever matches, and every POST gets
`403 Cross-site POST form submissions are forbidden`. The allowlist in `astro.config.mjs` must cover
any new domain the site is served from.

### Known limitation

The rate limiter in `src/actions/index.ts` is an in-module `Map`. On Vercel it resets on cold start,
so it effectively limits nothing. The honeypot is the only working spam defence. Move to
Upstash-backed limiting or Turnstile if spam actually appears.

## Agent Workflow

The main agent acts as an **orchestrator and planner**. For complex tasks:

1. **Plan first** — break the work into discrete steps before touching code.
2. **Delegate to subagents** — hand independent steps to subagents (via the Agent tool) wherever possible. Each subagent gets a self-contained prompt with the specific files, lines, and changes it owns.
3. **Parallelize** — launch subagents in parallel when their tasks have no dependencies on each other.
4. **Verify** — after subagents complete, review their actual changes before reporting done.

## Content & Data

All business content lives in `src/data/`:
- `services.ts` — 9 services with process steps, images
- `site.ts` — phone, email, nav items, credentials, cities, FAQ
- `team.ts` — team member bios and photos
- `gallery.ts` — before/after project entries

Placeholder text (`[BUSINESS ADDRESS HERE]`, `Lic. #WP-4471822`) needs real values before launch.

## Deployment

Hosted on **Vercel**. Astro is auto-detected. `vercel.json` sets cache headers for static assets.

`npx vercel --prod --yes` deploys the local working tree and aliases it to
`valmark-website.vercel.app`. Direct pushes to `main` are blocked — land changes via PR
(`gh pr create` → `gh pr merge`).

Preview deployments sit behind Vercel SSO and return `403`/`302` to unauthenticated requests, so
they are useless for testing form POSTs. Verify against the production alias.

After deploying, confirm the deployment actually landed (`npx vercel ls --prod`) before testing —
a failed deploy looks identical to an unfixed bug.
