import { join } from "node:path";
import type { APIRoute } from "astro";
import { roundIcon } from "../lib/roundIcon";

// Build-time generated rounded favicon: served as a cacheable static file
// instead of a base64 data URL bloating every page's <head>.
export const GET: APIRoute = async () => {
	const buffer = await roundIcon(join(process.cwd(), "src/assets/pfp.png"), 32);
	return new Response(new Uint8Array(buffer), {
		headers: { "Content-Type": "image/png" },
	});
};
