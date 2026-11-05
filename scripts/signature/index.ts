import { createHash } from "node:crypto";
import { contourCommands, pathBounds, pathData, pathLength } from "./geometry";
import { TrueTypeFont } from "./true-type";

export const FONT_SHA256 = "9341fda10adbfeb7efc94302b34507a3e227d7e7f5c432df3f5ac8753ff73d24";
const TEXT = "Aadit Agrawal";
const FONT_SIZE = 100;

// This pinned font/name has no substitutions or nonzero kerning pairs. General
// OpenType shaping and composite glyphs deliberately are not part of this tool.
export function generateSignature(bytes: Uint8Array) {
  if (createHash("sha256").update(bytes).digest("hex") !== FONT_SHA256) {
    throw new Error("Signature font checksum mismatch. Review a font update before regenerating.");
  }
  const font = new TrueTypeFont(bytes);
  const scale = FONT_SIZE / font.unitsPerEm;
  let x = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const letters = Array.from(TEXT, (char) => {
    const glyph = font.glyphFor(char);
    const commands = glyph.contours.flatMap((contour) =>
      contourCommands(contour, x, FONT_SIZE, scale),
    );
    x += glyph.advanceWidth * scale;
    const d = pathData(commands);
    if (commands.length) {
      const box = pathBounds(commands);
      minX = Math.min(minX, box.x1);
      minY = Math.min(minY, box.y1);
      maxX = Math.max(maxX, box.x2);
      maxY = Math.max(maxY, box.y2);
    }
    return { char, d, length: Math.round(pathLength(commands)) };
  });
  const padding = 2;
  const viewBox = [
    minX - padding,
    minY - padding,
    maxX - minX + padding * 2,
    maxY - minY + padding * 2,
  ]
    .map((value) => value.toFixed(1))
    .join(" ");
  return { text: TEXT, viewBox, letters };
}
