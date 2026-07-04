import { join } from "node:path";
import type { APIRoute } from "astro";
import { generateOgImage } from "../lib/ogImage";

export const GET: APIRoute = async () => {
	const buffer = await generateOgImage(join(process.cwd(), "src/assets/pfp.png"));
	return new Response(new Uint8Array(buffer), {
		headers: { "Content-Type": "image/png" },
	});
};
