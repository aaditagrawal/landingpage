const CELL = 10;

export type HeatCell = { x: number; y: number; score: number };
export type HeatLabel = { x: number; y: number; text: string };

/**
 * Emit a contribution heatmap as one <path> per intensity level instead of one
 * <rect> per day: ~20 bytes per cell instead of ~90, and it gzips far better.
 * Fill colors come from page CSS via [data-score].
 */
export function compactHeatmapSvg(opts: {
	cells: HeatCell[];
	labels: HeatLabel[];
	width: number;
	height: number;
	ariaLabel: string;
}): string {
	const byScore: string[][] = [[], [], [], [], []];
	for (const { x, y, score } of opts.cells) {
		byScore[score]?.push(`M${x} ${y}h${CELL}v${CELL}h-${CELL}z`);
	}
	const paths = byScore
		.map((segs, score) => (segs.length ? `<path data-score="${score}" d="${segs.join("")}"/>` : ""))
		.join("");
	const labels = opts.labels
		.map((l) => `<text x="${l.x}" y="${l.y}">${l.text}</text>`)
		.join("");
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${opts.height}" width="${opts.width}" height="${opts.height}" role="img" aria-label="${opts.ariaLabel}">${labels}${paths}</svg>`;
}

/**
 * Rebuild a ghchart.rshah.org SVG (one verbose <rect> per day plus styled
 * labels) into the compact path form. Returns "" if the source format is
 * unrecognized so the caller can fall back.
 */
export function compactGithubSvg(raw: string): string {
	const cells: HeatCell[] = [];
	const rectRe = /<rect[^>]*data-score="(\d)"[^>]*x="(\d+)" y="(\d+)"/g;
	for (const m of raw.matchAll(rectRe)) {
		cells.push({ score: Number(m[1]), x: Number(m[2]), y: Number(m[3]) });
	}
	if (cells.length === 0) return "";

	// Keep only the month labels (y="10"); weekday labels are noise.
	const labels: HeatLabel[] = [];
	const textRe = /<text[^>]*x="(\d+)" y="10"[^>]*>([^<]+)<\/text>/g;
	for (const m of raw.matchAll(textRe)) {
		labels.push({ x: Number(m[1]), y: 10, text: m[2] });
	}

	const size = raw.match(/<svg[^>]*width="(\d+)" height="(\d+)"/);
	const width = size ? Number(size[1]) : 663;
	const height = size ? Number(size[2]) : 104;

	return compactHeatmapSvg({
		cells,
		labels,
		width,
		height,
		ariaLabel: "GitHub contribution graph",
	});
}
