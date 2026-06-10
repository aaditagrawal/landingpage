import { join } from "node:path";
import type { APIRoute } from "astro";
import { roundIcon } from "../lib/roundIcon";

// Build-time generated rounded touch icon, served as a static file.
export const GET: APIRoute = async () => {
	const buffer = await roundIcon(join(process.cwd(), "src/assets/pfp.png"), 180);
	return new Response(new Uint8Array(buffer), {
		headers: { "Content-Type": "image/png" },
	});
};
