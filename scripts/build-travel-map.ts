/**
 * Precompute a simplified, region-filtered world map SVG for the travel page.
 * Run automatically before `astro build` via package.json.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { simplify } from "@turf/simplify";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { places } from "../src/data/places";
import { buildWorldMapSvg } from "../src/lib/travelMap";

const worldPath = resolve(import.meta.dirname, "../src/data/world.json");
const outPath = resolve(import.meta.dirname, "../public/travel-map.svg");

// SAFETY: src/data/world.json is committed to this repo, not fetched at runtime. It is a
// Natural Earth countries export whose features are all Polygon/MultiPolygon, and this prebuild
// script fails loudly here if that ever stops holding.
const world = JSON.parse(await Bun.file(worldPath).text()) as FeatureCollection<
  Polygon | MultiPolygon
>;

// Keep countries that overlap the India travel region instead of all 241.
const REGION = { minLat: 0, maxLat: 42, minLng: 55, maxLng: 105 };
const filtered: FeatureCollection<Polygon | MultiPolygon> = {
  type: "FeatureCollection",
  features: world.features.filter((feature) => {
    // Polygon coordinates nest 3 deep and MultiPolygon 4, so flattening 4 levels yields a
    // flat lng/lat list for either shape.
    const coords = feature.geometry.coordinates.flat(4);
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (let i = 0; i < coords.length; i += 2) {
      const lng = coords[i];
      const lat = coords[i + 1];
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    return (
      maxLng >= REGION.minLng &&
      minLng <= REGION.maxLng &&
      maxLat >= REGION.minLat &&
      minLat <= REGION.maxLat
    );
  }),
};

const simplified = simplify(filtered, { tolerance: 0.5, highQuality: false });
const svg = buildWorldMapSvg(places, simplified);

writeFileSync(outPath, svg);
console.log(`wrote ${outPath} (${(svg.length / 1024).toFixed(1)} KB)`);
