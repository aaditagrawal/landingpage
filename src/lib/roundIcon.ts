import { Buffer } from "node:buffer";
import sharp from "sharp";

export async function roundIcon(input: string | Buffer, size: number): Promise<Buffer> {
	const mask = Buffer.from(
		`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`,
	);

	return sharp(input)
		.resize(size, size, { fit: "cover" })
		.composite([{ input: mask, blend: "dest-in" }])
		.png()
		.toBuffer();
}

export function iconDataUrl(buffer: Buffer): string {
	return `data:image/png;base64,${buffer.toString("base64")}`;
}
