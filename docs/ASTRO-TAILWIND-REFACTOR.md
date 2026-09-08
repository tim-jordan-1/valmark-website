# Astro + Tailwind CSS Refactor Plan

> Convert the Valmark Waterproofing website from Claude Design Component (DC) runtime to Astro + Tailwind CSS.
> Eliminates `support.js` (69 KB), `image-slot.js` (65 KB), React 18 CDN dependency (~185 KB).
> Output: static site on Vercel with zero-JS pages and tiny interactive islands.

---

## Table of Contents

- [Phase 1: Project Setup](#phase-1-project-setup)
- [Phase 2: Data Layer](#phase-2-data-layer)
- [Phase 3: Layout & Shared Components](#phase-3-layout--shared-components)
- [Phase 4: Static Pages](#phase-4-static-pages)
- [Phase 5: Dynamic Service Detail Page](#phase-5-dynamic-service-detail-page)
- [Phase 6: Interactive Islands](#phase-6-interactive-islands)
- [Phase 7: Tailwind Conversion](#phase-7-tailwind-conversion)
- [Phase 8: Cleanup & Verification](#phase-8-cleanup--verification)
- [Subagent Assignment Map](#subagent-assignment-map)
- [Appendix: Complete Data Reference](#appendix-complete-data-reference)

---

## Design Tokens

These values are used across all phases. Every component and page references them.

| Token | Value | Tailwind Config Key | Usage |
|-------|-------|-------------------|-------|
| Primary | `#03334D` | `colors.primary` | Headers, nav, dark backgrounds, footer headings |
| Accent | `#1C9DD8` | `colors.accent` | CTAs, active states, section labels, accent borders |
| Light Accent | `#37C1F0` | `colors.accent-light` | Subpage hero labels ("Services", "About Us", etc.) |
| Accent BG | `#E7F6FD` | `colors.accent-bg` | Light blue section backgrounds |
| Text | `#333333` | `colors.text` | Body text, footer links |
| Text Secondary | `#555555` | `colors.text-secondary` | Paragraph text, descriptions |
| Text Tertiary | `#606060` | `colors.text-tertiary` | Muted labels, meta text |
| Border | `#E0E0E0` | `colors.border` | Card borders, dividers |
| Border Dark | `#CCCCCC` | `colors.border-dark` | Input borders, pill borders |
| BG Light | `#F7F7F7` | `colors.bg-light` | Breadcrumb bar |
| White | `#FFFFFF` | (default) | Page backgrounds, cards |

**Font:** Roboto via Google Fonts — weights 400, 500, 700, 900.
**Max width:** `1200px` (use Tailwind `max-w-[1200px]` or configure as `max-w-site`).
**Breakpoint:** `1000px` for mobile/desktop split (configure as `screens.lg: '1000px'`).

---

## Phase 1: Project Setup

### Task 1.1 — Initialize Astro project

**Files:** `package.json`, `astro.config.mjs`, `tsconfig.json`
**Complexity:** Small
**Dependencies:** None

```bash
npm create astro@latest . -- --template minimal --typescript strict
npx astro add tailwind
npx astro add vercel
```

Configure `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  integrations: [tailwindcss()],
  adapter: vercel(),
});
```

> Note: `output: 'static'` prefers full static generation. The Vercel adapter is needed only if we add server endpoints later (e.g. Resend for contact forms — see separate doc). For pure static, the adapter can be omitted and Vercel auto-detects.

### Task 1.2 — Configure Tailwind

**Files:** `tailwind.config.mjs`, `src/styles/global.css`
**Complexity:** Small
**Dependencies:** 1.1

`tailwind.config.mjs`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#03334D',
        accent: '#1C9DD8',
        'accent-light': '#37C1F0',
        'accent-bg': '#E7F6FD',
        'text-main': '#333333',
        'text-secondary': '#555555',
        'text-tertiary': '#606060',
        border: '#E0E0E0',
        'border-dark': '#CCCCCC',
        'bg-light': '#F7F7F7',
        'accent-text': '#D6EFFA',
      },
      fontFamily: {
        roboto: ['Roboto', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        site: '1200px',
      },
      screens: {
        lg: '1000px',
      },
    },
  },
  plugins: [],
};
```

`src/styles/global.css`:

```css
@import 'tailwindcss';

html { scroll-behavior: smooth; }
body { -webkit-font-smoothing: antialiased; }
input, select, textarea, button { font-family: inherit; }
```

### Task 1.3 — Set up project structure

**Files:** Directory tree creation
**Complexity:** Small
**Dependencies:** 1.1

```
src/
├── layouts/
│   └── Base.astro
├── pages/
│   ├── index.astro
│   ├── services/
│   │   ├── index.astro
│   │   └── [id].astro
│   ├── why.astro
│   ├── gallery.astro
│   ├── area.astro
│   └── contact.astro
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   ├── MobileBottomBar.astro
│   ├── ServiceCard.astro
│   ├── TeamCard.astro
│   ├── ProcessStep.astro
│   ├── CredentialCard.astro
│   ├── GalleryCard.astro
│   ├── BeforeAfterSlider.astro
│   ├── ImageCarousel.astro
│   └── LeadForm.astro
├── data/
│   ├── services.ts
│   ├── team.ts
│   ├── gallery.ts
│   └── site.ts
└── styles/
    └── global.css
```

### Task 1.4 — Move images

**Files:** `public/uploads/*`
**Complexity:** Small
**Dependencies:** 1.1

Move `uploads/` → `public/uploads/`. Astro serves `public/` as-is at the root, so image paths remain `/uploads/logo-transparent.png` etc.

```bash
mkdir -p public
mv uploads public/uploads
```

**Image inventory (11 files):**

| File | Used by |
|------|---------|
| `logo-transparent.png` | Header, footer |
| `mark-raic.png` | Team card (Mark Raic) |
| `laundry-before.jpeg` | Bathrooms before/after, gallery |
| `laundry-after.jpeg` | Gallery |
| `bathrooms-after.jpeg` | Bathrooms service card, carousel |
| `bathroom-work-1.jpeg` | Bathrooms carousel |
| `bathroom-work-2.jpeg` | Bathrooms carousel |
| `shower-before.jpeg` | Shower-bases before/after, gallery |
| `shower-after.jpeg` | Shower-bases service card, gallery |
| `retaining-wall-before.jpeg` | Retaining-walls before/after, gallery |
| `retaining-wall-after.jpeg` | Retaining-walls service card, gallery |

---

## Phase 2: Data Layer

### Task 2.1 — Services data

**File:** `src/data/services.ts`
**Complexity:** Medium
**Dependencies:** None (can be done in parallel with Phase 1)

Export typed service data including per-service process steps:

```ts
export interface ProcessStep {
  n: string;
  title: string;
  body: string;
}

export interface Service {
  id: string;
  name: string;
  blurb: string;
  long: string;
  before?: string;
  after?: string;
  images?: string[];
  steps: ProcessStep[];
}

export const services: Service[] = [
  {
    id: 'bathrooms',
    name: 'Bathrooms, ensuites and laundries',
    blurb: 'Floor and wall membrane at wastes, junctions and penetrations, sealed before tiling.',
    long: 'Bathroom, ensuite and laundry floors and wall junctions are membraned to the relevant Australian Standard, with wastes, hobs and penetrations sealed before tiling so water stays inside the tiled envelope.',
    before: '/uploads/laundry-before.jpeg',
    after: '/uploads/bathrooms-after.jpeg',
    images: ['/uploads/bathrooms-after.jpeg', '/uploads/bathroom-work-1.jpeg', '/uploads/bathroom-work-2.jpeg'],
    steps: [
      { n: '1', title: 'Inspect', body: 'We check the substrate, falls, wastes, penetrations and wet-area layout before work begins.' },
      { n: '2', title: 'Prepare', body: 'Surfaces are cleaned and prepared, with cracks, gaps and defects repaired where required.' },
      { n: '3', title: 'Detail', body: 'Corners, junctions, penetrations, wastes and other critical areas are sealed and detailed.' },
      { n: '4', title: 'Prime', body: 'The correct primer is selected and applied to suit the substrate and moisture conditions.' },
      { n: '5', title: 'Waterproof', body: 'The specified membrane system is applied to the required areas and film build.' },
      { n: '6', title: 'Inspect & Handover', body: 'We complete a final waterproofing inspection before the area is released for tiling or finishes.' },
    ],
  },
  {
    id: 'shower-bases',
    name: 'Shower bases, niches and hobless showers',
    blurb: 'Tanked shower bases, recessed niches and hobless showers detailed to fall correctly to waste.',
    long: 'Shower bases, niches and hobless showers are fully tanked and graded to fall to waste, with extra attention at the hob or level-entry junction where most shower leaks start.',
    before: '/uploads/shower-before.jpeg',
    after: '/uploads/shower-after.jpeg',
    steps: [
      { n: '1', title: 'Check Set-Out', body: 'We confirm shower falls, waste locations, niches, waterstops and surrounding floor levels.' },
      { n: '2', title: 'Prepare', body: 'The shower base and wall substrates are prepared and any defects are rectified.' },
      { n: '3', title: 'Detail', body: 'Waterstops, wastes, corners, niches, penetrations and junctions receive specialised waterproofing detailing.' },
      { n: '4', title: 'Prime', body: 'Compatible primers are applied to porous and non-porous surfaces as required.' },
      { n: '5', title: 'Waterproof', body: 'The shower area is waterproofed using the specified membrane system, including all critical transitions.' },
      { n: '6', title: 'Final Check', body: 'Membrane coverage, terminations and detailing are inspected before tiling proceeds, with testing where specified.' },
    ],
  },
  {
    id: 'balconies',
    name: 'Balconies, terraces and rooftops',
    blurb: 'Falls, membrane and door junctions corrected so water drains out, not back into the home.',
    long: 'We correct falls to outlets, membrane the deck and detail door and wall junctions on balconies, terraces and rooftops, so water is carried away instead of pooling or tracking inside.',
    steps: [
      { n: '1', title: 'Inspect Falls & Drainage', body: 'We check substrate condition, drainage, falls, outlets, door thresholds and perimeter details.' },
      { n: '2', title: 'Prepare', body: 'Surfaces are cleaned and repaired to provide a sound substrate for the waterproofing system.' },
      { n: '3', title: 'Detail Critical Areas', body: 'Junctions, upturns, penetrations, outlets, edges and movement joints are waterproofed and reinforced as required.' },
      { n: '4', title: 'Prime', body: 'The appropriate primer is applied to suit the substrate, membrane and site conditions.' },
      { n: '5', title: 'Apply Waterproofing', body: 'The specified external waterproofing system is installed for the intended exposed or covered finish.' },
      { n: '6', title: 'Inspect & Protect', body: 'The completed membrane is checked before screeds, tiles, protection layers or other finishes are installed.' },
    ],
  },
  {
    id: 'retaining-walls',
    name: 'Retaining walls and planter boxes',
    blurb: 'Below-ground membrane and drainage on retaining walls and planter boxes to keep water out of the structure.',
    long: 'Retaining walls and planter boxes are membraned and drained below ground so water in the soil is directed away from the structure instead of pushing through it.',
    before: '/uploads/retaining-wall-after.jpeg',
    after: '/uploads/retaining-wall-before.jpeg',
    steps: [
      { n: '1', title: 'Assess', body: 'We inspect the structure, water exposure, drainage requirements, penetrations and access to determine the correct system.' },
      { n: '2', title: 'Prepare', body: 'Concrete or blockwork is cleaned and defects, voids and damaged areas are repaired.' },
      { n: '3', title: 'Detail', body: 'Corners, construction joints, penetrations and wall-to-floor transitions are sealed and reinforced.' },
      { n: '4', title: 'Waterproof', body: 'The selected below-ground or planter-box waterproofing system is applied, including root-resistant systems where required.' },
      { n: '5', title: 'Protect & Drain', body: 'Drainage and protection layers are installed where required to protect the membrane and manage water pressure.' },
      { n: '6', title: 'Final Inspection', body: 'The system is inspected before backfilling, landscaping or covering the waterproofed area.' },
    ],
  },
  {
    id: 'repairs',
    name: 'Waterproofing repairs and leak remediation',
    blurb: 'Diagnosis and repair of failed waterproofing and active leaks, without a full strip-out where it is not needed.',
    long: 'We trace a leak to its source, then repair or replace only the failed section of membrane — full strip-outs only where the existing system genuinely cannot be saved.',
    steps: [
      { n: '1', title: 'Investigate', body: 'We inspect the affected area to identify the likely water entry point and cause of failure.' },
      { n: '2', title: 'Expose', body: 'Failed sealants, membranes or finishes are removed as required to access the problem area.' },
      { n: '3', title: 'Repair', body: 'Cracks, joints, penetrations and damaged substrates are repaired and prepared for waterproofing.' },
      { n: '4', title: 'Reinstate', body: 'The waterproofing system and critical detailing are reinstated using compatible materials.' },
      { n: '5', title: 'Test & Handover', body: 'The repaired area is inspected and, where appropriate, tested before being returned to service.' },
    ],
  },
  {
    id: 'epoxy-barriers',
    name: 'Epoxy moisture barriers',
    blurb: 'Epoxy moisture barrier coatings for damp or rising concrete slabs, applied ahead of flooring to stop moisture reaching the finish.',
    long: 'We apply epoxy moisture barrier coatings to damp or rising concrete slabs before flooring goes down, stopping residual slab moisture from reaching the finish and causing bond failure or odour down the track.',
    steps: [
      { n: '1', title: 'Assess Moisture', body: 'The substrate is checked to determine the moisture condition and appropriate moisture-control system.' },
      { n: '2', title: 'Prepare', body: 'Concrete or screed is cleaned and mechanically prepared where required to provide a suitable surface.' },
      { n: '3', title: 'Apply Barrier', body: 'The specified epoxy moisture barrier is applied at the required coverage and number of coats.' },
      { n: '4', title: 'Inspect & Release', body: 'Coverage and curing are checked before waterproofing, flooring or other finishes are installed.' },
    ],
  },
  {
    id: 'moisture-testing',
    name: 'Moisture testing of concrete and screeds',
    blurb: 'Relative humidity and moisture testing of concrete and screeds, so flooring is only laid once the slab is genuinely ready.',
    long: 'Relative humidity and moisture testing of concrete and screeds gives a written reading before flooring goes down, so the job proceeds only once the slab has genuinely dried, not just by calendar guesswork.',
    steps: [
      { n: '1', title: 'Inspect', body: 'We review the screed age, condition, environment and proposed waterproofing or flooring system.' },
      { n: '2', title: 'Test', body: 'Moisture readings are taken across representative areas using the appropriate testing method.' },
      { n: '3', title: 'Record', body: 'Results are recorded so wet areas, variations and potential concerns can be identified.' },
      { n: '4', title: 'Advise', body: 'We provide a clear recommendation on whether the substrate is ready or requires further drying or moisture control.' },
    ],
  },
  {
    id: 'substrate-inspections',
    name: 'Substrate inspections',
    blurb: 'Pre-tiling and pre-membrane substrate inspections that catch falls, cracking and prep issues before they become leaks.',
    long: 'Pre-tiling and pre-membrane substrate inspections check falls, cracking and surface preparation before the next trade starts, catching the issues that turn into leaks once tiles or membrane go over them.',
    steps: [
      { n: '1', title: 'Inspect', body: 'We assess the substrate for cracking, contamination, damage, movement and general condition.' },
      { n: '2', title: 'Check Key Details', body: 'Falls, drainage, penetrations, joints, transitions, surface finish and moisture conditions are reviewed.' },
      { n: '3', title: 'Identify Requirements', body: 'Any repairs, preparation, moisture treatment or detailing required before waterproofing are identified.' },
      { n: '4', title: 'Recommend', body: 'We provide a clear scope of what is required to create a suitable substrate for the proposed waterproofing system.' },
    ],
  },
  {
    id: 'joint-replacement',
    name: 'Silicon and movement joint replacement',
    blurb: 'Removal and replacement of failed silicon and movement joints at junctions, ready for use the same day.',
    long: 'Failed silicon and movement joints at wall, floor and bath junctions are cut out and replaced with the correct sealant for the location, ready for use the same day.',
    steps: [
      { n: '1', title: 'Inspect', body: 'Existing joints are checked for failed sealant, cracking, separation and signs of water entry.' },
      { n: '2', title: 'Remove', body: 'Failed sealant and unsuitable joint materials are carefully removed.' },
      { n: '3', title: 'Prepare', body: 'Joint faces are cleaned and prepared, with primer applied where required.' },
      { n: '4', title: 'Reinstate', body: 'Backing rod or bond-breaking material is installed where required before applying the compatible new sealant.' },
      { n: '5', title: 'Finish & Inspect', body: 'The joint is tooled to the correct profile and inspected after installation.' },
    ],
  },
];
```

### Task 2.2 — Site data, team, gallery, and other content

**File:** `src/data/site.ts`, `src/data/team.ts`, `src/data/gallery.ts`
**Complexity:** Small
**Dependencies:** None

`src/data/site.ts`:

```ts
export const site = {
  phone: '0422 878 034',
  tel: 'tel:0422878034',
  email: 'admin@valmark.com.au',
  address: '[BUSINESS ADDRESS HERE]',
  warranty: 7,
  license: 'Lic. #WP-4471822',
};

export const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Why Us', href: '/why' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Service Area', href: '/area' },
  { label: 'Contact', href: '/contact' },
];

export const threeBoxes = [
  'Highly Skilled Team',
  'High-Quality Equipment & Materials',
  '10+ Years Experience',
];

export const stats = [
  { value: '10+', label: 'Years in the industry' },
  { value: '7 yr', label: 'Transferable warranty' },
];

export const credentials = [
  { title: 'Fully Insured', body: 'Comprehensive insurance coverage for added peace of mind.' },
  { title: '10+ Years Experience', body: 'Over a decade of experience across construction, major projects and industrial waterproofing applications.' },
  { title: 'Engineering Experience', body: 'Led by a Civil & Structural Engineering (Honours) graduate, bringing a strong technical understanding of structures, substrates and waterproofing systems.' },
  { title: 'NCC & Australian Standards', body: 'Waterproofing works completed in accordance with applicable National Construction Code requirements and relevant Australian Standards.' },
  { title: 'Product & System Warranties', body: 'Manufacturer warranties available on eligible waterproofing products and systems, subject to applicable terms and installation requirements.' },
];

export const cities = [
  'Melbourne CBD', 'Richmond', 'South Yarra', 'St Kilda', 'Brighton',
  'Glen Waverley', 'Box Hill', 'Doncaster', 'Preston', 'Brunswick',
  'Essendon', 'Footscray', 'Werribee', 'Frankston', 'Dandenong',
  'Ringwood', 'Croydon', 'Berwick', 'Pakenham', 'Geelong',
  'Ballarat', 'Bendigo',
];

export const faqItems = [
  { q: 'How do you find where water is really coming from?', a: 'We use thermal imaging, acoustic detectors and moisture meters to pinpoint leaks behind walls, under floors and underground — all with minimal disruption.' },
  { q: 'Do you subcontract any of the work?', a: 'No. The same licensed crew handles diagnosis through handover — no subcontractors sent to your house.' },
  { q: 'How long does a basement waterproofing job take?', a: 'Most interior drain and sump systems are completed in 2–4 days, depending on the length of the run.' },
  { q: 'Is the warranty transferable if I sell my house?', a: 'Yes. Our 7-year written warranty is transferable to the next owner at no extra cost.' },
  { q: 'What areas do you service?', a: 'We cover a 40-mile radius across three counties, with most inspections booked within 48 hours.' },
];
```

`src/data/team.ts`:

```ts
export interface TeamMember {
  initials: string;
  name: string;
  role: string;
  bio: string;
  photo?: string;
}

export const team: TeamMember[] = [
  {
    initials: 'VB',
    name: 'Valerio Bello',
    role: 'Owner | Waterproofer',
    bio: 'Valerio has over 10 years of experience in the waterproofing industry and holds a Certificate III in Waterproofing. Starting in domestic waterproofing, he has progressed into commercial and civil construction, with experience in bathrooms, laundries, balconies, retaining walls, polyurethane liquid membranes, PVC sheeting, podiums and torch-on systems. He brings a hands-on approach, strong attention to detail and a commitment to quality workmanship and reliable project outcomes.',
  },
  {
    initials: 'MR',
    name: 'Mark Raic',
    role: 'Owner | Civil Engineer',
    photo: '/uploads/mark-raic.png',
    bio: "Mark holds a Bachelor's Degree with Honours in Civil and Structural Engineering, as well as a degree in Business Management. He has worked across multiple large-scale construction projects and brings practical, hands-on experience in industrial waterproofing and remedial works. He focuses on practical solutions, quality workmanship and reliable project outcomes.",
  },
];
```

`src/data/gallery.ts`:

```ts
export interface GalleryEntry {
  cat: string;
  title: string;
  meta: string;
  before: string;
  after: string;
}

export const gallery: GalleryEntry[] = [
  { cat: 'Showers', title: 'Hobless shower base, tanked and screeded', meta: 'Membrane + niche + screed · 2 days', before: '/uploads/shower-before.jpeg', after: '/uploads/shower-after.jpeg' },
  { cat: 'Retaining Walls', title: 'Below-ground retaining wall, sheet membrane', meta: 'Membrane + drainage cell · 3 days', before: '/uploads/retaining-wall-after.jpeg', after: '/uploads/retaining-wall-before.jpeg' },
  { cat: 'Laundries', title: 'Internal laundry floor, tanked to walls', meta: 'Bond breaker + two coats · 1 day', before: '/uploads/laundry-before.jpeg', after: '/uploads/laundry-after.jpeg' },
];

export const galleryCategories = ['All', 'Showers', 'Retaining Walls', 'Laundries'];
```

---

## Phase 3: Layout & Shared Components

### Task 3.1 — Base layout

**File:** `src/layouts/Base.astro`
**Complexity:** Medium
**Dependencies:** 1.2 (Tailwind config), 2.2 (site data)

The base layout wraps every page. It includes `<head>`, Google Fonts, the Header, Footer, and MobileBottomBar.

```astro
---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import MobileBottomBar from '../components/MobileBottomBar.astro';
import '../styles/global.css';

interface Props {
  title?: string;
  activePage?: string;
}

const { title = 'Valmark Waterproofing — Melbourne', activePage = '' } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet" />
</head>
<body class="font-roboto text-base text-text-main bg-white">
  <Header activePage={activePage} />
  <main>
    <slot />
  </main>
  <Footer />
  <MobileBottomBar />
</body>
</html>
```

### Task 3.2 — Header component

**File:** `src/components/Header.astro`
**Complexity:** Medium
**Dependencies:** 2.2 (navItems, site data)

Key details:
- Sticky header: `position: sticky; top: 0; z-index: 50`
- Desktop-only top info bar (email + phone) on `bg-primary`
- Logo: `uploads/logo-transparent.png`, 168×112px
- Desktop nav: 6 links with active state (accent border-bottom when `activePage` matches)
- "Enquiry Now" CTA button: `bg-accent text-white uppercase tracking-wider font-bold px-8 py-5`
- Mobile: hamburger "Menu" button at `lg:hidden`, toggles a dropdown overlay
- Scroll progress bar at bottom: 4px tall, `bg-accent` fill on `bg-border` track

The mobile menu toggle and scroll progress bar require `<script>` tags (see Phase 6, Tasks 6.4 and 6.5).

Props: `activePage: string` — one of `'home' | 'services' | 'why' | 'gallery' | 'area' | 'contact'`.

Active link style: `border-b-2 border-accent text-accent`. Inactive: `border-b-2 border-transparent text-primary`.

### Task 3.3 — Footer component

**File:** `src/components/Footer.astro`
**Complexity:** Small
**Dependencies:** 2.1 (services for footer links), 2.2 (navItems, site data)

4-column responsive grid (`grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))`):
1. **Logo + description**: Logo image (110px height), paragraph about the company
2. **Services**: 2-column sub-grid of 9 service links (each links to `/services/{id}`)
3. **Company**: 6 nav links (Home, Services, Why Us, Gallery, Service Area, Contact)
4. **Contact**: Phone (bold, 20px), email link, "Schedule an inspection" link

Bottom bar: `border-t border-border`, `© 2026 Valmark Waterproofing LLC` + license text.

### Task 3.4 — Mobile bottom bar

**File:** `src/components/MobileBottomBar.astro`
**Complexity:** Small
**Dependencies:** 2.2 (site data for phone)

Fixed bottom bar, `lg:hidden`, `z-50`, 2-column grid:
- Left: "Call Now" → `tel:0422878034`, `bg-accent text-white`
- Right: "Enquiry Now" → links to `/contact`, `bg-primary text-white`

Both: `text-center py-[18px] font-bold uppercase tracking-wider`

The footer needs `pb-[62px] lg:pb-0` to avoid overlap on mobile.

---

## Phase 4: Static Pages

### Task 4.1 — Home page

**File:** `src/pages/index.astro`
**Complexity:** Large
**Dependencies:** 2.1, 2.2, 3.1, Task 6.1 (BeforeAfterSlider)

Sections in order:
1. **Hero** — `bg-primary text-white`, 2-column grid. H1: "Protect Your Home With Expert Waterproofing Solutions". Subtext mentioning 7-year warranty. Two CTAs: "Contact Us" (white bg) and "Enquiry Now" (accent bg). Right side: placeholder image.
2. **Lead form** — White card with shadow, centered. "Get Your Free Quote Today" heading. 4-column responsive grid: name, email, phone, service select. Full-width textarea. Submit button. Confirmation message area.
3. **Three boxes** — Top border `border-t-2 border-primary`, 3-column grid. Each: checkmark icon (accent bg, white text) + bold text.
4. **Services grid** — "What We Do" label, "Our Waterproofing Services" heading. 3-column grid of first 6 services. Each card: `BeforeAfterSlider` (if images exist, else placeholder), name, blurb, "Read more →" link to `/services/{id}`. "View All Services" button links to `/services`.
5. **Commercial / Residential** — Full-width 2-column. Left: dark bg `#052a3f`, building icon, "Commercial" + description. Right: `bg-primary`, house icon, "Residential" + description.
6. **About preview** — 2-column. Left: text about Valmark + "Learn More" button + phone. Right: placeholder image + floating 7-year warranty badge (accent bg, circle).
7. **CTA bar** — `bg-primary text-white`, centered. "For The Best In Waterproofing & Related Trades, Call ValMark" + "Contact Us" button.
8. **Why Us credentials** — `bg-accent-bg`. "Why Valmark" label. First 2 credentials as large dark cards (`bg-primary`), next 3 as white cards with `border-t-3 border-accent`. Each numbered 01–05.

### Task 4.2 — Services page

**File:** `src/pages/services/index.astro`
**Complexity:** Medium
**Dependencies:** 2.1, 3.1

Sections:
1. **Hero** — `bg-primary text-white`, centered. "Services" label, "Fix The Cause, Not The Stain" H1, description.
2. **Services grid** — 3-column grid of all 9 services. Each card: after image (or placeholder), name, blurb, "Read more →" link to `/services/{id}`.

### Task 4.3 — Why Us page

**File:** `src/pages/why.astro`
**Complexity:** Medium
**Dependencies:** 2.2 (stats, credentials, team), 3.1

Sections:
1. **Hero** — `bg-primary text-white`, centered. "About Us" label, "A Qualified, Insured And Experienced Team" H1, description.
2. **Stats bar** — `bg-accent-bg`, 2-column responsive grid. Each: large bold number + label below.
3. **Credentials grid** — "Built on Experience. Backed by Technical Knowledge." heading. 3-column grid of 5 credential cards. Each: checkmark icon, title, body.
4. **Team section** — "Meet The Team" heading. Grid of 2 team cards. Each: photo or initials circle (110×110), name (24px bold), role (accent, uppercase), bio.

### Task 4.4 — Gallery page

**File:** `src/pages/gallery.astro`
**Complexity:** Medium
**Dependencies:** 2.3 (gallery data), 3.1, Task 6.3 (GalleryFilter)

Sections:
1. **Hero** — `bg-primary text-white`, centered. "Our Work" label, "Wet On Monday, Dry By Friday" H1, description.
2. **Filter chips** — Centered flex-wrap row of 4 buttons: All, Showers, Retaining Walls, Laundries. Active: `bg-primary text-white`. Inactive: `bg-white text-primary border border-border-dark`. JS toggles active state and shows/hides cards by `data-cat`.
3. **Gallery grid** — 2-column grid (min 480px each). Each card: side-by-side before/after images (or placeholders), category label, title, meta text.

### Task 4.5 — Service Area page

**File:** `src/pages/area.astro`
**Complexity:** Medium
**Dependencies:** 2.2 (cities), 3.1, Task 6.6 (PostcodeChecker)

Sections:
1. **Hero** — `bg-primary text-white`, centered. "Service Area" label, "Waterproofing Across Victoria" H1, description. Postcode input + "Check coverage" button + result message. (JS in Phase 6.)
2. **Content** — 2-column grid. Left: "Where We Work" heading, 22 city pills (`bg-accent-bg rounded-full px-5 py-[11px] font-semibold text-primary`), description with phone link. Right: map placeholder (diagonal stripe pattern).

### Task 4.6 — Contact page

**File:** `src/pages/contact.astro`
**Complexity:** Medium
**Dependencies:** 2.2, 3.1, Task 6.7 (form handler)

Sections:
1. **Hero** — `bg-primary text-white`, centered. "Free Inspection" label, "Get In Touch With Waterproofing Specialists" H1.
2. **Content** — 2-column grid. Left: contact form (name, phone, email, service select, message textarea, submit button). Right: map placeholder + hours/email info card.

Contact form fields:
- Full name (required)
- Phone (required, inputMode="tel")
- Email (required, type="email")
- Service select (9 options pre-populated)
- Message textarea
- Submit button: "Book your inspection today", `bg-accent text-white uppercase`

Hours: Mon–Fri 7:00–6:00 · Sat 8:00–2:00, Emergency dispatch any hour.

---

## Phase 5: Dynamic Service Detail Page

### Task 5.1 — Service detail route

**File:** `src/pages/services/[id].astro`
**Complexity:** Large
**Dependencies:** 2.1, 3.1, Task 6.2 (ImageCarousel)

Uses `getStaticPaths()` to generate 9 static pages at build time:

```astro
---
import { services } from '../../data/services';
import Base from '../../layouts/Base.astro';
import ProcessStep from '../../components/ProcessStep.astro';
import ImageCarousel from '../../components/ImageCarousel.astro';

export function getStaticPaths() {
  return services.map((s) => ({ params: { id: s.id }, props: { service: s } }));
}

const { service } = Astro.props;
const related = services.filter((s) => s.id !== service.id);
const stepsCount = service.steps.length;
const stepsWord = { 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven' }[stepsCount] || stepsCount;
---
```

Sections:
1. **Breadcrumb** — `bg-bg-light border-b border-border`. Home › Services › {service name}.
2. **Hero** — `bg-primary text-white`, 2-column grid. Left: "Service" label, H1 (service name), long description, "Get Free Inspection" + "Call Now" CTAs. Right: image carousel (or placeholder if no images).
3. **Process steps** — "{N} Steps, One Crew, No Surprises" heading. 3-column responsive grid. Each step: numbered circle (`bg-primary text-white`, 44px round), title, body.
4. **Warranty banner** — `bg-accent-bg`. "Warranty" label, "7 Years, Transferable To The Next Owner" heading, description, "Get Free Inspection" CTA.
5. **Related services** — "Related services" heading. Flex-wrap row of 8 pill links (`border border-border-dark rounded-full px-[22px] py-3`) linking to `/services/{id}`.

### Task 5.2 — ProcessStep component

**File:** `src/components/ProcessStep.astro`
**Complexity:** Small
**Dependencies:** None

Props: `n: string`, `title: string`, `body: string`

```astro
---
interface Props { n: string; title: string; body: string; }
const { n, title, body } = Astro.props;
---
<div class="bg-white border border-border shadow-lg p-7">
  <div class="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">{n}</div>
  <h3 class="font-bold text-xl mt-[18px] mb-[10px]">{title}</h3>
  <p class="text-text-secondary leading-[1.7]">{body}</p>
</div>
```

---

## Phase 6: Interactive Islands

These are the only components that ship JavaScript to the client. Each uses a `<script>` tag inside an Astro component — no React needed.

### Task 6.1 — BeforeAfterSlider

**File:** `src/components/BeforeAfterSlider.astro`
**Complexity:** Medium
**Dependencies:** None

Props: `beforeSrc: string`, `afterSrc: string`, `id: string`

HTML structure:
```html
<div class="ba-slider" data-slider style="aspect-ratio:4/3; position:relative; overflow:hidden; background:#EDEDED;">
  <img class="ba-after" src={afterSrc} alt="After" style="width:100%;height:100%;object-fit:cover;" />
  <div class="ba-clip" style="position:absolute;top:0;left:0;bottom:0;width:50%;overflow:hidden;">
    <img src={beforeSrc} alt="Before" style="position:absolute;top:0;left:0;width:<computed>%;height:100%;object-fit:cover;" />
  </div>
  <div class="ba-line" style="position:absolute;top:0;bottom:0;left:50%;width:2px;background:#fff;transform:translateX(-50%);pointer-events:none;box-shadow:0 0 6px rgba(0,0,0,.5);z-index:2;"></div>
  <div class="ba-handle" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:52px;height:52px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.35);cursor:ew-resize;z-index:3;">
    <span style="font:700 15px Arial;color:#03334D;letter-spacing:2px;">◄►</span>
  </div>
  <div style="position:absolute;left:14px;bottom:14px;background:#fff;padding:8px 18px;font:700 15px Roboto;color:#03334D;pointer-events:none;z-index:2;">Before</div>
  <div style="position:absolute;right:14px;bottom:14px;background:#fff;padding:8px 18px;font:700 15px Roboto;color:#03334D;pointer-events:none;z-index:2;">After</div>
</div>
```

JS logic (~35 lines, in a `<script>` tag at component bottom):
- Event delegation on `document` for all `[data-slider]` elements
- On `pointerdown` on `.ba-handle`: set pointer capture, listen `pointermove`/`pointerup`
- On move: `pct = clamp(0, 100, (clientX - rect.left) / rect.width * 100)`
- Set `.ba-clip` width, `.ba-line` left, `.ba-handle` left to `pct%`
- Set inner before `<img>` width to `100 / (pct/100)` percent (so it stays the full slider width, clipped)

### Task 6.2 — ImageCarousel

**File:** `src/components/ImageCarousel.astro`
**Complexity:** Medium
**Dependencies:** None

Props: `images: string[]`, `alt: string`

Only renders carousel controls when `images.length > 1`. Otherwise renders a single `<img>`.

HTML: Container with one `<img>` tag. Prev/next buttons (circles, 40px, `bg-primary/70 text-white`). Dot indicators at bottom center.

JS logic (~30 lines):
- Track `currentIndex`, update `img.src` on prev/next/dot click
- Fade: set `opacity:0`, wait 280ms (CSS transition), swap src, set `opacity:1`
- Auto-advance every 6000ms, reset timer on manual nav
- `clearInterval` on page unload

### Task 6.3 — GalleryFilter

**File:** inline `<script>` in `src/pages/gallery.astro`
**Complexity:** Small
**Dependencies:** None

~12 lines:
- Click handler on `.gallery-chip` buttons
- Read `data-cat` from clicked chip
- Toggle `hidden` on `.gallery-card` elements by comparing `data-cat`
- Swap chip styles: active gets `bg-primary text-white`, inactive gets `bg-white text-primary`

### Task 6.4 — MobileMenu

**File:** inline `<script>` in `src/components/Header.astro`
**Complexity:** Small
**Dependencies:** None

~10 lines:
- Toggle `hidden` on `#mobile-menu` when `#menu-btn` is clicked
- Close menu when any nav link inside the menu is clicked

### Task 6.5 — ScrollProgress

**File:** inline `<script>` in `src/components/Header.astro`
**Complexity:** Small
**Dependencies:** None

~6 lines:
```js
const bar = document.getElementById('scroll-bar');
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = max > 4 ? Math.min(100, scrollY / max * 100) + '%' : '0';
}, { passive: true });
```

### Task 6.6 — PostcodeChecker

**File:** inline `<script>` in `src/pages/area.astro`
**Complexity:** Small
**Dependencies:** None

~10 lines:
- Read 4-digit postcode from input (filter non-numeric, max 4 chars)
- On button click: if length !== 4 → "Enter a 4-digit postcode." Else if `(+zip % 3 === 0)` → "Just outside our line — call us, we make exceptions." Else → "Covered — next inspection window in 2 days."
- Display message in a `<div>` below the input

### Task 6.7 — Form handlers

**File:** inline `<script>` in `src/pages/index.astro` and `src/pages/contact.astro`
**Complexity:** Small
**Dependencies:** None

Two separate forms with the same pattern:
```js
document.getElementById('lead-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('lead-msg').textContent =
    'Thanks — a technician will call you back within one business hour.';
});
```

> Note: These are placeholder handlers. For real email delivery, see the separate Resend integration doc. When Resend is implemented, these forms will POST to an Astro server endpoint instead.

---

## Phase 7: Tailwind Conversion

### Task 7.1 — Convert inline styles to Tailwind utilities

**Complexity:** Large (but mechanical)
**Dependencies:** All Phase 4 and 5 tasks

This is not a separate task — it happens during each page/component build in Phases 3–5. However, here's a reference mapping for the most common inline style patterns:

| Inline style | Tailwind class |
|-------------|---------------|
| `max-width:1200px;margin:0 auto;padding:0 24px` | `max-w-site mx-auto px-6` |
| `font:700 17px Roboto,sans-serif;text-transform:uppercase;letter-spacing:.03em` | `font-bold text-[17px] uppercase tracking-wider` |
| `background:#03334D;color:#fff` | `bg-primary text-white` |
| `background:#1C9DD8;color:#fff` | `bg-accent text-white` |
| `background:#E7F6FD` | `bg-accent-bg` |
| `border:1px solid #E0E0E0` | `border border-border` |
| `box-shadow:rgba(100,100,111,.2) 0px 7px 29px 0px` | `shadow-lg` (or custom) |
| `display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:26px` | `grid grid-cols-[repeat(auto-fit,minmax(310px,1fr))] gap-[26px]` |
| `font:400 18px/1.7 'Roboto',sans-serif;color:#555555` | `text-lg leading-[1.7] text-text-secondary` |
| `display:flex;align-items:center;gap:30px` | `flex items-center gap-[30px]` |
| `border-radius:100px` | `rounded-full` |
| `padding:17px 30px` | `px-[30px] py-[17px]` |
| `font-size:clamp(34px,4.8vw,52px)` | `text-[clamp(34px,4.8vw,52px)]` |

### Task 7.2 — Responsive handling

**Complexity:** Small
**Dependencies:** 7.1

The current site uses JS-based mobile detection (`window.innerWidth < 1000`). With Tailwind, replace with CSS breakpoints:

- Elements visible only on desktop: `hidden lg:block` (or `lg:flex`, `lg:grid`)
- Elements visible only on mobile: `lg:hidden`
- Desktop top bar in header: `hidden lg:block`
- Desktop nav: `hidden lg:flex`
- Mobile menu button: `lg:hidden`
- Mobile bottom bar: `lg:hidden`
- Footer bottom padding: `pb-[62px] lg:pb-0`

---

## Phase 8: Cleanup & Verification

### Task 8.1 — Delete DC runtime files

**Complexity:** Small
**Dependencies:** All above completed

```bash
rm support.js image-slot.js BeforeAfterSlider.dc.html index.html
```

### Task 8.2 — Update configuration files

**Files:** `CLAUDE.md`, `vercel.json`, `.gitignore`
**Complexity:** Small
**Dependencies:** 8.1

`CLAUDE.md` — rewrite to document:
- Astro + Tailwind stack
- `npm run dev` for local development
- `npm run build` for production build
- Project structure
- Data files in `src/data/`
- Island components (which ones ship JS)

`vercel.json` — simplify or remove. Vercel auto-detects Astro. If keeping, update:
```json
{
  "headers": [
    {
      "source": "/uploads/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

`.gitignore` — add:
```
node_modules/
dist/
.astro/
```

Remove `.image-slots.state.json` (no longer relevant).

### Task 8.3 — Verification checklist

**Complexity:** Small
**Dependencies:** All above

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without errors
- [ ] Home page renders — hero, lead form, 6 service cards, all sections visible
- [ ] Before/after sliders drag correctly on service cards (home page)
- [ ] Services page shows 9 cards
- [ ] Each of 9 service detail pages renders correct name, description, steps
- [ ] Image carousel works on bathrooms detail (3 images, auto-advance)
- [ ] Service detail pages with no images show placeholder
- [ ] Why Us page shows stats, 5 credentials, 2 team members
- [ ] Gallery page filter chips work (All, Showers, Retaining Walls, Laundries)
- [ ] Service Area page postcode checker works (try 3000, 3001)
- [ ] Contact form shows confirmation on submit
- [ ] Lead form (home) shows confirmation on submit
- [ ] Mobile layout at <1000px: hamburger menu works, bottom bar visible, desktop nav hidden
- [ ] All navigation links work between pages
- [ ] Footer service links go to correct detail pages
- [ ] No console errors
- [ ] Network tab: no fetches to unpkg.com or any CDN except Google Fonts
- [ ] `vercel build` succeeds
- [ ] Deploy preview works on Vercel

---

## Subagent Assignment Map

Tasks are structured for parallel execution where possible.

| Agent | Tasks | Depends on | Scope |
|-------|-------|-----------|-------|
| **Agent 1** | 1.1, 1.2, 1.3, 1.4 | — | Project setup, Tailwind config, structure, move images |
| **Agent 2** | 2.1, 2.2 | — | Data layer (runs in parallel with Agent 1) |
| **Agent 3** | 3.1, 3.2, 3.3, 3.4 | 1, 2 | Layout and shared components |
| **Agent 4** | 4.1 | 2, 3, 6.1 | Home page (largest single page) |
| **Agent 5** | 4.2, 4.3 | 2, 3 | Services list + Why Us pages |
| **Agent 6** | 4.4, 4.5, 4.6 | 2, 3 | Gallery + Area + Contact pages |
| **Agent 7** | 5.1, 5.2 | 2, 3 | Service detail dynamic route |
| **Agent 8** | 6.1, 6.2 | — | Interactive islands: slider + carousel |
| **Agent 9** | 6.3–6.7 | — | Interactive islands: filter, menu, scroll, postcode, forms |
| **Agent 10** | 8.1, 8.2, 8.3 | All above | Cleanup + verification (runs last) |

**Critical path:** Agents 1+2 (parallel) → Agent 3 → Agents 4–9 (parallel) → Agent 10

**Estimated total effort:** ~6–8 hours for a developer working serially; ~2–3 hours with agents running in parallel.

---

## Appendix: Complete Data Reference

All data needed for the conversion is in the [Phase 2 tasks above](#phase-2-data-layer). The TypeScript source code in those tasks is copy-paste ready — it contains the full text of every service, process step, team bio, gallery entry, city name, credential, and FAQ item extracted from the current `index.html`.

### Business Constants

| Constant | Value |
|----------|-------|
| Phone | `0422 878 034` |
| Phone (tel link) | `tel:0422878034` |
| Email | `admin@valmark.com.au` |
| Address | `[BUSINESS ADDRESS HERE]` — needs real value before launch |
| Warranty | 7 years |
| License | `Lic. #WP-4471822` — placeholder, needs real value before launch |
| Hours | Mon–Fri 7:00–6:00 · Sat 8:00–2:00 · Emergency dispatch any hour |

### Services Quick Reference

| # | ID | Name | Has images? | Steps |
|---|-----|------|-------------|-------|
| 1 | `bathrooms` | Bathrooms, ensuites and laundries | before + after + 3 carousel | 6 |
| 2 | `shower-bases` | Shower bases, niches and hobless showers | before + after | 6 |
| 3 | `balconies` | Balconies, terraces and rooftops | none | 6 |
| 4 | `retaining-walls` | Retaining walls and planter boxes | before + after | 6 |
| 5 | `repairs` | Waterproofing repairs and leak remediation | none | 5 |
| 6 | `epoxy-barriers` | Epoxy moisture barriers | none | 4 |
| 7 | `moisture-testing` | Moisture testing of concrete and screeds | none | 4 |
| 8 | `substrate-inspections` | Substrate inspections | none | 4 |
| 9 | `joint-replacement` | Silicon and movement joint replacement | none | 5 |
