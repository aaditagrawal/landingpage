// Original, bounded reader for the simple TrueType outlines used by Sacramento.
// Format reference: https://learn.microsoft.com/typography/opentype/spec/glyf
export type Point = { x: number; y: number; onCurve: boolean };
export type Glyph = { contours: Point[][]; advanceWidth: number };

class Bytes {
  constructor(private readonly view: DataView) {}

  get length(): number {
    return this.view.byteLength;
  }

  slice(offset: number, length: number): Bytes {
    if (
      !Number.isInteger(offset) ||
      !Number.isInteger(length) ||
      offset < 0 ||
      length < 0 ||
      offset + length > this.length
    ) {
      throw new Error("Truncated TrueType data");
    }
    return new Bytes(new DataView(this.view.buffer, this.view.byteOffset + offset, length));
  }

  u8(offset: number): number {
    return this.view.getUint8(offset);
  }

  u16(offset: number): number {
    return this.view.getUint16(offset);
  }

  i16(offset: number): number {
    return this.view.getInt16(offset);
  }

  u32(offset: number): number {
    return this.view.getUint32(offset);
  }
}

export class TrueTypeFont {
  readonly unitsPerEm: number;
  private readonly tables = new Map<string, Bytes>();
  private readonly glyphCount: number;
  private readonly metricCount: number;
  private readonly longLocations: boolean;
  private readonly cmap: Bytes;
  private readonly glyphs = new Map<number, Glyph>();

  constructor(data: Uint8Array) {
    const bytes = new Bytes(new DataView(data.buffer, data.byteOffset, data.byteLength));
    if (bytes.u32(0) !== 0x00010000) throw new Error("Expected TrueType outlines");
    const count = bytes.u16(4);
    bytes.slice(12, count * 16);
    for (let i = 0; i < count; i++) {
      const offset = 12 + i * 16;
      const tag = String.fromCharCode(...Array.from({ length: 4 }, (_, j) => bytes.u8(offset + j)));
      if (this.tables.has(tag)) throw new Error(`Duplicate font table: ${tag}`);
      this.tables.set(tag, bytes.slice(bytes.u32(offset + 8), bytes.u32(offset + 12)));
    }
    const head = this.table("head");
    this.unitsPerEm = head.u16(18);
    if (this.unitsPerEm < 16 || this.unitsPerEm > 16384) throw new Error("Invalid units per em");
    const locationFormat = head.i16(50);
    if (locationFormat !== 0 && locationFormat !== 1) throw new Error("Unsupported loca format");
    this.longLocations = locationFormat === 1;
    this.glyphCount = this.table("maxp").u16(4);
    this.metricCount = this.table("hhea").u16(34);
    if (this.metricCount === 0 || this.metricCount > this.glyphCount)
      throw new Error("Invalid font metrics");
    this.table("hmtx").slice(0, this.metricCount * 4 + (this.glyphCount - this.metricCount) * 2);
    this.table("loca").slice(0, (this.glyphCount + 1) * (this.longLocations ? 4 : 2));
    const cmap = this.table("cmap");
    let unicode: Bytes | undefined;
    for (let i = 0; i < cmap.u16(2); i++) {
      const offset = 4 + i * 8;
      const platform = cmap.u16(offset);
      const encoding = cmap.u16(offset + 2);
      if (platform !== 0 && !(platform === 3 && encoding === 1)) continue;
      const start = cmap.u32(offset + 4);
      if (cmap.u16(start) === 4) unicode = cmap.slice(start, cmap.u16(start + 2));
    }
    if (!unicode) throw new Error("Expected Unicode cmap format 4");
    const segments = unicode.u16(6) / 2;
    if (!Number.isInteger(segments) || segments === 0) throw new Error("Invalid cmap segments");
    unicode.slice(0, 16 + segments * 8);
    this.cmap = unicode;
  }

  private table(tag: string): Bytes {
    const table = this.tables.get(tag);
    if (!table) throw new Error(`Missing font table: ${tag}`);
    return table;
  }

  glyphFor(char: string): Glyph {
    const code = char.codePointAt(0);
    if (char.length !== 1 || code === undefined || code > 0xffff)
      throw new Error("Expected one BMP character");
    const count = this.cmap.u16(6) / 2;
    for (let i = 0; i < count; i++) {
      const end = this.cmap.u16(14 + i * 2);
      const start = this.cmap.u16(16 + count * 2 + i * 2);
      if (code < start || code > end) continue;
      const delta = this.cmap.i16(16 + count * 4 + i * 2);
      const location = 16 + count * 6 + i * 2;
      const relative = this.cmap.u16(location);
      let index = relative ? this.cmap.u16(location + relative + (code - start) * 2) : code;
      if (!relative || index !== 0) index = (index + delta) & 0xffff;
      if (index === 0) break;
      return this.glyph(index);
    }
    throw new Error(`No glyph for ${char}`);
  }

  private glyph(index: number): Glyph {
    const cached = this.glyphs.get(index);
    if (cached) return cached;
    if (index >= this.glyphCount) throw new Error("Glyph index out of range");
    const locations = this.table("loca");
    const location = (i: number) =>
      this.longLocations ? locations.u32(i * 4) : locations.u16(i * 2) * 2;
    const start = location(index);
    const end = location(index + 1);
    const data = this.table("glyf").slice(start, end - start);
    const advanceWidth = this.table("hmtx").u16(Math.min(index, this.metricCount - 1) * 4);
    if (data.length === 0) return { contours: [], advanceWidth };
    const contourCount = data.i16(0);
    if (contourCount < 0)
      throw new Error("Composite glyphs are outside the signature reader's scope");
    if (contourCount === 0) return { contours: [], advanceWidth };
    const ends = Array.from({ length: contourCount }, (_, i) => data.u16(10 + i * 2));
    let previous = -1;
    for (const endPoint of ends) {
      if (endPoint <= previous) throw new Error("Invalid contour endpoints");
      previous = endPoint;
    }
    const pointCount = previous + 1;
    let cursor = 10 + contourCount * 2;
    const instructions = data.u16(cursor);
    cursor += 2;
    data.slice(cursor, instructions);
    cursor += instructions;
    const flags: number[] = [];
    while (flags.length < pointCount) {
      const flag = data.u8(cursor++);
      const repeat = flag & 8 ? data.u8(cursor++) : 0;
      if (flags.length + repeat + 1 > pointCount) throw new Error("Invalid glyph flag repeat");
      for (let j = 0; j <= repeat; j++) flags.push(flag);
    }
    const coordinates = (shortBit: number, sameBit: number): number[] => {
      let value = 0;
      return flags.map((flag) => {
        if (flag & shortBit) value += data.u8(cursor++) * (flag & sameBit ? 1 : -1);
        else if (!(flag & sameBit)) {
          value += data.i16(cursor);
          cursor += 2;
        }
        return value;
      });
    };
    const xs = coordinates(2, 16);
    const ys = coordinates(4, 32);
    const points = flags.map((flag, i) => ({ x: xs[i], y: ys[i], onCurve: Boolean(flag & 1) }));
    let first = 0;
    const contours = ends.map((last) => {
      const contour = points.slice(first, last + 1);
      first = last + 1;
      return contour;
    });
    const glyph = { contours, advanceWidth };
    this.glyphs.set(index, glyph);
    return glyph;
  }
}
