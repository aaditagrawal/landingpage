import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { contourCommands, pathBounds, pathData, pathLength } from "./geometry";
import { generateSignature } from "./index";
import { TrueTypeFont } from "./true-type";

const font = new Uint8Array(
  await readFile(new URL("../fonts/Sacramento-Regular.ttf", import.meta.url)),
);
const artifact = await readFile(
  new URL("../../src/components/name-paths.json", import.meta.url),
  "utf8",
);
const view = (bytes: Uint8Array) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
function table(bytes: Uint8Array, name: string): number {
  const data = view(bytes);
  for (let i = 0; i < data.getUint16(4); i++) {
    const offset = 12 + i * 16;
    if (String.fromCharCode(...bytes.slice(offset, offset + 4)) === name)
      return data.getUint32(offset + 8);
  }
  throw new Error(`Missing test table ${name}`);
}
function corrupt(change: (data: DataView, bytes: Uint8Array) => void): Uint8Array {
  const bytes = font.slice();
  change(view(bytes), bytes);
  return bytes;
}
function firstGlyph(bytes: Uint8Array): number {
  // Sacramento's cmap maps A to glyph 373. Read its short loca entry independently.
  return table(bytes, "glyf") + view(bytes).getUint16(table(bytes, "loca") + 373 * 2) * 2;
}

describe("signature parity", () => {
  test("regenerates every path, rounded length and viewBox byte for byte", () => {
    expect(JSON.stringify(generateSignature(font), null, "\t") + "\n").toBe(artifact);
  });
  test("reads typed-array slices without reading their backing buffer's prefix", () => {
    const padded = new Uint8Array(font.length + 20);
    padded.set(font, 11);
    expect(generateSignature(padded.subarray(11, 11 + font.length))).toEqual(
      generateSignature(font),
    );
  });
  test("rejects unreviewed font changes before parsing", () => {
    expect(() =>
      generateSignature(corrupt((data) => data.setUint8(100, data.getUint8(100) ^ 1))),
    ).toThrow("checksum");
  });
  test("rejects unsupported characters rather than drawing a missing glyph", () => {
    const reader = new TrueTypeFont(font);
    expect(() => reader.glyphFor("😀")).toThrow("BMP");
    expect(() => reader.glyphFor("\u0000")).toThrow("No glyph");
  });
});

describe("font boundary checks", () => {
  test("rejects truncated table directories and bodies", () => {
    for (const size of [0, 1, 4, 12, 100, 284, 2000, 4408, font.length - 3]) {
      expect(() => new TrueTypeFont(font.slice(0, size))).toThrow();
    }
  });
  test("rejects invalid table offsets, sfnt formats, units, metrics and loca formats", () => {
    const changes = [
      (data: DataView) => data.setUint32(0, 0x4f54544f),
      (data: DataView) => data.setUint32(20, 0xffffffff),
      (data: DataView, bytes: Uint8Array) => data.setUint16(table(bytes, "head") + 18, 0),
      (data: DataView, bytes: Uint8Array) => data.setInt16(table(bytes, "head") + 50, 2),
      (data: DataView, bytes: Uint8Array) => data.setUint16(table(bytes, "hhea") + 34, 0),
    ];
    for (const change of changes) expect(() => new TrueTypeFont(corrupt(change))).toThrow();
  });
  test("rejects out-of-bounds cmap subtable offsets", () => {
    const damaged = corrupt((data, bytes) => data.setUint32(table(bytes, "cmap") + 8, 0xffffffff));
    expect(() => new TrueTypeFont(damaged)).toThrow();
  });
  test("rejects composite glyphs, reversed locations, invalid endpoints and instructions", () => {
    const changes = [
      (data: DataView, bytes: Uint8Array) => data.setInt16(firstGlyph(bytes), -1),
      (data: DataView, bytes: Uint8Array) => data.setUint16(table(bytes, "loca") + 374 * 2, 0),
      (data: DataView, bytes: Uint8Array) => data.setUint16(firstGlyph(bytes) + 12, 0),
      (data: DataView, bytes: Uint8Array) => {
        const glyph = firstGlyph(bytes);
        data.setUint16(glyph + 10 + data.getInt16(glyph) * 2, 0xffff);
      },
    ];
    for (const change of changes)
      expect(() => new TrueTypeFont(corrupt(change)).glyphFor("A")).toThrow();
  });
  test("rejects flag repetitions past the declared point count", () => {
    const damaged = corrupt((data, bytes) => {
      const glyph = firstGlyph(bytes);
      const contours = data.getInt16(glyph);
      // Declare one point in the first contour and one in the second.
      data.setUint16(glyph + 10, 0);
      data.setUint16(glyph + 12, 1);
      const instructions = glyph + 10 + contours * 2;
      const flags = instructions + 2 + data.getUint16(instructions);
      data.setUint8(flags, 8);
      data.setUint8(flags + 1, 255);
    });
    expect(() => new TrueTypeFont(damaged).glyphFor("A")).toThrow("repeat");
  });
});

describe("quadratic geometry", () => {
  test("measures lines and resets at moves without adding a pen-lift distance", () => {
    expect(
      pathLength([
        { type: "M", x: 0, y: 0 },
        { type: "L", x: 3, y: 4 },
        { type: "M", x: 100, y: 100 },
      ]),
    ).toBe(5);
  });
  test("handles zero length, straight quadratics and reversing cusps", () => {
    for (const [control, end, length] of [
      [0, 0, 0],
      [5, 10, 10],
      [10, 0, 10],
    ]) {
      expect(
        pathLength([
          { type: "M", x: 0, y: 0 },
          { type: "Q", x1: control, y1: 0, x: end, y: 0 },
        ]),
      ).toBeCloseTo(length, 10);
    }
  });
  test("integrates a curved segment and finds its true extrema", () => {
    const commands = [
      { type: "M", x: 0, y: 0 },
      { type: "Q", x1: 10, y1: 20, x: 20, y: 0 },
    ] satisfies Parameters<typeof pathLength>[0];
    expect(pathLength(commands)).toBeCloseTo(29.57885715089195, 10);
    expect(pathBounds(commands)).toEqual({ x1: 0, y1: 0, x2: 20, y2: 10 });
  });
  test("serializes integer and negative coordinates like the existing artwork", () => {
    expect(
      pathData([
        { type: "M", x: -1.001, y: 3 },
        { type: "Q", x1: 2.5, y1: -3, x: -4, y: -0.001 },
      ]),
    ).toBe("M-1 3Q2.50-3-4 0");
  });
  test("inserts implied on-curve midpoints between off-curve points", () => {
    const commands = contourCommands(
      [
        { x: 0, y: 0, onCurve: false },
        { x: 10, y: 10, onCurve: false },
      ],
      0,
      0,
      1,
    );
    expect(commands[0]).toEqual({ type: "M", x: 5, y: -5 });
    expect(commands.filter((command) => command.type === "Q")).toHaveLength(2);
  });
});
