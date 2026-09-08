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
    images: ['/uploads/shower-after.jpeg'],
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
    before: '/uploads/retaining-wall-before.jpeg',
    after: '/uploads/retaining-wall-after.jpeg',
    images: ['/uploads/retaining-wall-after.jpeg'],
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
