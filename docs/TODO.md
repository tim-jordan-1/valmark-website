# Valmark Website — Outstanding Work

## 1. Fix Postcode Checker (Service Area Page)

**File:** `src/pages/area.astro` lines 58–72

**Problem:** The current checker uses a dummy formula (`+val % 3 === 0`) instead of validating against real Victorian postcodes. Every postcode divisible by 3 shows "just outside our line" — completely unrelated to actual coverage.

**What needs to happen:**
- Define a list/set of Victorian postcode ranges that fall within service area (Greater Melbourne metro + regional cities listed in `src/data/site.ts` → `cities` array)
- Key ranges: 3000–3207 (Melbourne CBD & inner suburbs), 3211–3341 (Geelong/Bellarine), 3350–3357 (Ballarat), 3550–3556 (Bendigo), 3427–3442 (outer west), 3750–3810 (outer north/east), 3800–3820 (Berwick/Pakenham corridor), 3910–3980 (Frankston/Mornington Peninsula)
- Replace the modulo check with a real lookup against these ranges
- Three result states: covered, outside coverage (with "call us" fallback), and invalid postcode

**Current cities served (from `site.ts`):** Melbourne CBD, Richmond, South Yarra, St Kilda, Brighton, Glen Waverley, Box Hill, Doncaster, Preston, Brunswick, Essendon, Footscray, Werribee, Frankston, Dandenong, Ringwood, Croydon, Berwick, Pakenham, Geelong, Ballarat, Bendigo

---

## 2. Replace Map Placeholder (Service Area Page)

**File:** `src/pages/area.astro` lines 47–53

**Problem:** The right column shows a hatched "Map placeholder" div instead of an actual map.

**What needs to happen:**
- Embed a static Google Maps image (or iframe) showing the Greater Victoria metropolitan area
- Highlight or outline the service coverage region (roughly the area covered by the cities listed above)
- Options in order of simplicity:
  1. **Google Maps Static API** — a single `<img>` tag with the Maps Static API URL, styled markers or a path polygon outlining coverage. Requires a Google Maps API key (add to `.env`)
  2. **Google Maps Embed** — an `<iframe>` centered on Melbourne with appropriate zoom level. No API key needed for basic embeds, but no custom highlighting
  3. **Static image** — a pre-made map image saved to `public/uploads/` and referenced as `<img>`. Most control over styling but needs manual creation
- Whichever option: ensure it's responsive and maintains the 4:3 aspect ratio of the current placeholder

---

## 3. Email Automation (In Progress)

**Docs:** `docs/RESEND-EMAIL-INTEGRATION.md`
**Action file:** `src/actions/index.ts`

**Status:** Implementation is underway. The integration doc and Astro action exist. Remaining work:

- [ ] Create Resend account and get API key
- [ ] Verify `valmark.com.au` domain in Resend (DNS records: SPF, DKIM, DMARC)
- [ ] Add `RESEND_API_KEY` via `wrangler secret put`
- [ ] Wire up both forms (home page lead form + contact page form) to the Astro action
- [ ] Test admin notification email to `admin@valmark.com.au`
- [ ] Test visitor auto-reply email
- [ ] Switch sender from `onboarding@resend.dev` (dev) to `noreply@valmark.com.au` (prod) once domain is verified
