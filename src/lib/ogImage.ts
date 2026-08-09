import sharp from "sharp";
import { roundIcon } from "./roundIcon";

const WIDTH = 1200;
const HEIGHT = 630;
const PFP_SIZE = 132;
const GAP = 72;

// Longest line: "I like figuring out tech by making things with it."
const TEXT_WIDTH = 748;

const NAME_SIZE = 58;
const BODY_SIZE = 30;
const NAME_ASCENT = Math.round(NAME_SIZE * 0.78);
const BODY_DESCENT = Math.round(BODY_SIZE * 0.22);
const NAME_TO_BODY = 58;
const BODY_TO_BODY = 44;

const nameBaseline = NAME_ASCENT;
const line2Baseline = nameBaseline + NAME_TO_BODY;
const line3Baseline = line2Baseline + BODY_TO_BODY;
const textBottom = line3Baseline + BODY_DESCENT;
const textCenterY = textBottom / 2;
const pfpTopRel = textCenterY - PFP_SIZE / 2;

const bboxTop = Math.min(0, pfpTopRel);
const bboxBottom = Math.max(textBottom, pfpTopRel + PFP_SIZE);
const bboxHeight = bboxBottom - bboxTop;
const bboxWidth = TEXT_WIDTH + GAP + PFP_SIZE;

const offsetX = Math.round((WIDTH - bboxWidth) / 2);
const offsetY = Math.round((HEIGHT - bboxHeight) / 2 - bboxTop);

const textX = offsetX;
const nameY = offsetY + nameBaseline;
const line2Y = offsetY + line2Baseline;
const line3Y = offsetY + line3Baseline;
const pfpLeft = offsetX + TEXT_WIDTH + GAP;
const pfpTop = Math.round(offsetY + pfpTopRel);

export async function generateOgImage(pfpPath: string): Promise<Buffer> {
  const pfp = await roundIcon(pfpPath, PFP_SIZE);

  const bgSvg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<radialGradient id="glow" cx="50%" cy="0%" r="75%">
				<stop offset="0%" stop-color="#576BFF" stop-opacity="0.14"/>
				<stop offset="65%" stop-color="#576BFF" stop-opacity="0"/>
			</radialGradient>
			<pattern id="dots" width="84" height="84" patternUnits="userSpaceOnUse">
				<circle cx="1" cy="1" r="1" fill="#f5f7f4" fill-opacity="0.09"/>
			</pattern>
			<pattern id="dots2" width="21" height="21" patternUnits="userSpaceOnUse" x="10.5" y="10.5">
				<circle cx="1" cy="1" r="1" fill="#f5f7f4" fill-opacity="0.045"/>
			</pattern>
		</defs>
		<rect width="100%" height="100%" fill="#0c0e0e"/>
		<rect width="100%" height="100%" fill="url(#dots)"/>
		<rect width="100%" height="100%" fill="url(#dots2)"/>
		<rect width="100%" height="100%" fill="url(#glow)"/>
	</svg>`;

  const textSvg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
		<text x="${textX}" y="${nameY}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${NAME_SIZE}" font-weight="600" fill="#f5f7f4" letter-spacing="-1.2">Aadit Agrawal</text>
		<text x="${textX}" y="${line2Y}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${BODY_SIZE}" fill="#e3e6e3">Codex Creative at OpenAI.</text>
		<text x="${textX}" y="${line3Y}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${BODY_SIZE}" fill="#949a97">I like figuring out tech by making things with it.</text>
	</svg>`;

  return sharp(Buffer.from(bgSvg))
    .composite([
      { input: Buffer.from(textSvg), left: 0, top: 0 },
      { input: pfp, left: pfpLeft, top: pfpTop },
    ])
    .png()
    .toBuffer();
}
