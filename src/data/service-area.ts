// Approximate service-area outline for Greater Melbourne — not an official boundary.
// [lat, lng] order (Leaflet convention, not GeoJSON [lng, lat]).

export const serviceAreaCenter: [number, number] = [-37.85, 145.0];
export const serviceAreaZoom: number = 9;

export const serviceAreaPolygon: [number, number][] = [
  [-37.58, 144.73], // Sunbury (NW)
  [-37.6, 144.94], // Craigieburn (N)
  [-37.6, 145.1], // Mernda / Doreen
  [-37.66, 145.25], // Yarra Glen (NE)
  [-37.76, 145.35], // Lilydale
  [-37.91, 145.36], // Belgrave / the Dandenongs (E)
  [-37.94, 145.42], // Emerald / Cockatoo
  [-38.08, 145.48], // Pakenham (SE)
  [-38.05, 145.35], // Berwick
  [-38.1, 145.28], // Cranbourne
  [-38.145, 145.13], // Frankston (S) — southern extent, on the bay's east shore
  // Hug the bayside coast north — tight to the shore so coastal suburbs stay inside
  [-38.07, 145.125], // Carrum / Seaford
  [-38.0, 145.09], // Mordialloc
  [-37.975, 145.03], // Beaumaris / Black Rock
  [-37.95, 145.0], // Sandringham
  [-37.91, 144.99], // Brighton
  [-37.868, 144.975], // St Kilda
  [-37.84, 144.94], // Port Melbourne
  // Cross the narrow river mouth to the bay's west shore
  [-37.86, 144.89], // Williamstown
  [-37.87, 144.83], // Altona
  [-37.92, 144.79], // Point Cook
  [-38.0, 144.72], // Werribee South (coast)
  [-37.93, 144.66], // Werribee (SW)
  [-37.68, 144.58], // Melton (W)
];
