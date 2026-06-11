/**
 * Generates per-letter SVG path data for the hero signature ("Aadit Agrawal"
 * set in Sacramento) so the site never ships the font itself.
 *
 * Usage: bun scripts/generate-name-svg.ts
 * Output: src/components/name-paths.json
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import opentype from "opentype.js";
import { svgPathProperties } from "svg-path-properties";

const TEXT = "Aadit Agrawal";
const FONT_SIZE = 100;
const FONT_URL =
	"https://github.com/google/fonts/raw/main/ofl/sacramento/Sacramento-Regular.ttf";
const FONT_CACHE = join(import.meta.dirname, ".cache", "Sacramento-Regular.ttf");
const OUT_FILE = join(import.meta.dirname, "..", "src", "components", "name-paths.json");

async function loadFont(): Promise<opentype.Font> {
	if (!existsSync(FONT_CACHE)) {
		console.log(`Downloading Sacramento from ${FONT_URL}`);
		const res = await fetch(FONT_URL);
		if (!res.ok) throw new Error(`Font download failed: ${res.status}`);
		await mkdir(dirname(FONT_CACHE), { recursive: true });
		await writeFile(FONT_CACHE, new Uint8Array(await res.arrayBuffer()));
	}
	const buf = await readFile(FONT_CACHE);
	return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

const font = await loadFont();
const paths = font.getPaths(TEXT, 0, FONT_SIZE, FONT_SIZE, { kerning: true });

type Letter = { char: string; d: string; length: number };
const letters: Letter[] = [];
let minX = Infinity;
let minY = Infinity;
let maxX = -Infinity;
let maxY = -Infinity;

paths.forEach((path, i) => {
	const d = path.toPathData(2);
	const char = TEXT[i];
	if (!d) {
		// Space — no geometry, but keep it as a pacing marker (pen lift).
		letters.push({ char, d: "", length: 0 });
		return;
	}
	const box = path.getBoundingBox();
	minX = Math.min(minX, box.x1);
	minY = Math.min(minY, box.y1);
	maxX = Math.max(maxX, box.x2);
	maxY = Math.max(maxY, box.y2);
	letters.push({
		char,
		d,
		length: Math.round(new svgPathProperties(d).getTotalLength()),
	});
});

// A little breathing room so round terminals aren't clipped.
const PAD = 2;
const viewBox = [
	(minX - PAD).toFixed(1),
	(minY - PAD).toFixed(1),
	(maxX - minX + PAD * 2).toFixed(1),
	(maxY - minY + PAD * 2).toFixed(1),
].join(" ");

await writeFile(OUT_FILE, JSON.stringify({ text: TEXT, viewBox, letters }, null, "\t") + "\n");
console.log(`Wrote ${letters.length} letters to ${OUT_FILE} (viewBox ${viewBox})`);
