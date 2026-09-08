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
| `src/components/` | Header, Footer, MobileBottomBar, BeforeAfterSlider, ImageCarousel, ProcessStep |
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
- `index.astro` / `contact.astro` — form submit handlers (placeholder, no backend)

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
