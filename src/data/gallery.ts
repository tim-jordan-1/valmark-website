export interface GalleryEntry {
  cat: string;
  title: string;
  meta: string;
  before: string;
  after: string;
}

export const gallery: GalleryEntry[] = [
  { cat: 'Showers', title: 'Hobless shower base, tanked and screeded', meta: 'Membrane + niche + screed · 2 days', before: '/uploads/shower-before.jpeg', after: '/uploads/shower-after.jpeg' },
  { cat: 'Retaining Walls', title: 'Below-ground retaining wall, sheet membrane', meta: 'Membrane + drainage cell · 3 days', before: '/uploads/retaining-wall-before.jpeg', after: '/uploads/retaining-wall-after.jpeg' },
  { cat: 'Laundries', title: 'Internal laundry floor, tanked to walls', meta: 'Bond breaker + two coats · 1 day', before: '/uploads/laundry-before.jpeg', after: '/uploads/laundry-after.jpeg' },
  { cat: 'Epoxy', title: 'Epoxy floor coating, sealed and finished', meta: 'Surface prep + epoxy seal · 1 day', before: '/uploads/epoxy-before.png', after: '/uploads/epoxy-after.png' },
  { cat: 'Leak Remediation', title: 'Leak remediation, source traced and sealed', meta: 'Leak detection + membrane repair · 2 days', before: '/uploads/leak-remediation-before.png', after: '/uploads/leak-remediation-after.png' },
];

export const galleryCategories = ['All', 'Showers', 'Retaining Walls', 'Laundries', 'Epoxy', 'Leak Remediation'];
