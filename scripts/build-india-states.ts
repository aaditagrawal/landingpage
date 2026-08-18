/**
 * Download and simplify Indian state boundaries for the travel map inset.
 * Run: bun run build:map-data
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { simplify } from "@turf/simplify";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";

const SOURCE =
  "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States";
const outPath = resolve(import.meta.dirname, "../src/data/india-states.json");

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`failed to fetch India states (HTTP ${res.status})`);

// SAFETY: SOURCE is a pinned GeoJSON file of Indian state boundaries whose features are all
// Polygon/MultiPolygon. This script is run by hand to regenerate committed data, never at
// request time, and @turf/simplify throws on anything that is not a valid FeatureCollection.
const raw = (await res.json()) as FeatureCollection<Polygon | MultiPolygon>;
const simplified = simplify(raw, { tolerance: 0.02, highQuality: false });

for (const feature of simplified.features) {
  feature.properties = { name: feature.properties?.NAME_1 ?? "" };
}

writeFileSync(outPath, JSON.stringify(simplified));
console.log(`wrote ${outPath} (${(JSON.stringify(simplified).length / 1024).toFixed(1)} KB)`);
