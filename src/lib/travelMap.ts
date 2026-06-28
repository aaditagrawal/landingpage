import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { geoBounds, geoEqualEarth, geoGraticule, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, MultiPoint, MultiPolygon, Polygon } from "geojson";
import type { Place } from "../data/places";

export const WORLD_VB = { w: 960, h: 520 };
const IN_ID = "356";
const FIT_PAD = 20;

const world = JSON.parse(
	readFileSync(resolve(process.cwd(), "src/data/world.json"), "utf8"),
) as FeatureCollection<Polygon | MultiPolygon>;

const indiaFeature = world.features.find((f) => String(f.id) === IN_ID) as
	| Feature<Polygon | MultiPolygon>
	| undefined;

function escapeAttr(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function expandIndiaBounds(bounds: [[number, number], [number, number]]): [[number, number], [number, number]] {
	const [[x0, y0], [x1, y1]] = bounds;
	const lonSpan = x1 - x0;
	const latSpan = y1 - y0;
	const minLon = 18;
	const minLat = 14;
	const expand = 0.35;
	const targetLon = Math.max(lonSpan * (1 + expand * 2), minLon);
	const targetLat = Math.max(latSpan * (1 + expand * 2), minLat);
	const padLon = (targetLon - lonSpan) / 2;
	const padLat = (targetLat - latSpan) / 2;
	return [
		[Math.max(-180, x0 - padLon), Math.max(-85, y0 - padLat)],
		[Math.min(180, x1 + padLon), Math.min(85, y1 + padLat)],
	];
}

function indiaFitTarget(): MultiPoint {
	if (!indiaFeature) {
		return {
			type: "MultiPoint",
			coordinates: [
				[68, 6],
				[98, 6],
				[98, 37],
				[68, 37],
			],
		};
	}
	const [[x0, y0], [x1, y1]] = expandIndiaBounds(geoBounds(indiaFeature));
	return {
		type: "MultiPoint",
		coordinates: [
			[x0, y0],
			[x1, y0],
			[x1, y1],
			[x0, y1],
		],
	};
}

function markerElements(markers: Array<Place & { x: number; y: number }>): string {
	return markers
		.map((place) => {
			const label = escapeAttr(place.name);
			const id = escapeAttr(place.id);
			const x = place.x.toFixed(2);
			const y = place.y.toFixed(2);
			const r = place.home ? 3.25 : 2.5;
			const homeClass = place.home ? " travel-dot--home" : "";
			return `<g class="travel-marker" data-id="${id}" data-name="${label}" tabindex="0" role="button" aria-label="${label}"><circle class="travel-ring" cx="${x}" cy="${y}" r="6"/><circle class="travel-hit" cx="${x}" cy="${y}" r="8"/><circle class="travel-dot${homeClass}" cx="${x}" cy="${y}" r="${r}"/></g>`;
		})
		.join("");
}

function projectPlaces(projection: ReturnType<typeof geoEqualEarth>, places: Place[]): Array<Place & { x: number; y: number }> {
	const out: Array<Place & { x: number; y: number }> = [];
	for (const place of places) {
		const pt = projection([place.lng, place.lat]);
		if (!pt || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) continue;
		out.push({ ...place, x: pt[0], y: pt[1] });
	}
	return out;
}

export type MapTransform = { k: number; tx: number; ty: number };

/** Zoom/pan that frames India within the world-projected map. */
export function computeIndiaTransform(projection: ReturnType<typeof geoEqualEarth>): MapTransform {
	const corners = indiaFitTarget().coordinates;
	let px0 = Infinity;
	let py0 = Infinity;
	let px1 = -Infinity;
	let py1 = -Infinity;

	for (const coord of corners) {
		const pt = projection(coord as [number, number]);
		if (!pt) continue;
		px0 = Math.min(px0, pt[0]);
		py0 = Math.min(py0, pt[1]);
		px1 = Math.max(px1, pt[0]);
		py1 = Math.max(py1, pt[1]);
	}

	const contentW = px1 - px0;
	const contentH = py1 - py0;
	const k = Math.min((WORLD_VB.w - FIT_PAD * 2) / contentW, (WORLD_VB.h - FIT_PAD * 2) / contentH);
	const cx = (px0 + px1) / 2;
	const cy = (py0 + py1) / 2;

	return {
		k,
		tx: WORLD_VB.w / 2 - cx * k,
		ty: WORLD_VB.h / 2 - cy * k,
	};
}

export function buildWorldMapSvg(places: Place[]): string {
	const projection = geoEqualEarth().fitSize([WORLD_VB.w, WORLD_VB.h], world);
	const homeTransform = computeIndiaTransform(projection);
	const globalTransform: MapTransform = { k: 1, tx: 0, ty: 0 };
	const path = geoPath(projection);
	const graticule = path(geoGraticule().step([15, 15])()) ?? "";
	const countries = world.features
		.map((feature) => {
			const d = path(feature);
			if (!d) return "";
			return `<path class="travel-land" d="${d}"/>`;
		})
		.join("");
	const markers = markerElements(projectPlaces(projection, places));
	const layer = `<path class="travel-graticule" d="${graticule}"/>${countries}${markers}`;

	const transforms = escapeAttr(JSON.stringify({ global: globalTransform, home: homeTransform }));

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WORLD_VB.w} ${WORLD_VB.h}" width="${WORLD_VB.w}" height="${WORLD_VB.h}" data-vb-w="${WORLD_VB.w}" data-vb-h="${WORLD_VB.h}" data-map-transforms="${transforms}" role="img" aria-label="Map of places visited in India"><rect class="travel-ocean" width="${WORLD_VB.w}" height="${WORLD_VB.h}"/><g class="travel-zoom-layer">${layer}</g></svg>`;
}
