/** Compare the committed generator with the owned implementation. No legacy runtime dependency is retained. */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { arch, cpus, loadavg, platform, release } from "node:os";
import { generateSignature } from "./signature";
import { contourCommands, pathData, pathLength, type Command } from "./signature/geometry";
import { TrueTypeFont } from "./signature/true-type";

const BASE = "7abb428846f4bb629c5aaa51a70433efe4a2ab8a";
const root = join(import.meta.dirname, "..");
const cache = join(import.meta.dirname, ".cache", "signature-baseline");
const samples = Number(process.env.SIGNATURE_BENCH_SAMPLES ?? 30);
const warmups = 8;
if (!Number.isInteger(samples) || samples < 10)
  throw new Error("Use at least 10 benchmark samples");
const startingLoad = loadavg();
await mkdir(cache, { recursive: true });
const run = (args: string[], cwd = root) =>
  execFileSync(process.execPath, args, { cwd, stdio: "pipe" });
const source = execFileSync("git", ["show", `${BASE}:scripts/generate-name-svg.ts`], {
  cwd: root,
  encoding: "utf8",
});
await writeFile(
  join(cache, "package.json"),
  JSON.stringify({
    private: true,
    type: "module",
    dependencies: { "opentype.js": "2.0.0", "svg-path-properties": "2.2.0" },
  }),
);
run(
  (await Bun.file(join(cache, "bun.lock")).exists())
    ? ["install", "--frozen-lockfile"]
    : ["install"],
  cache,
);
const fontPath = join(root, "scripts/fonts/Sacramento-Regular.ttf");
const cachedSource = source
  .replace(/const FONT_CACHE = .*;/, `const FONT_CACHE = ${JSON.stringify(fontPath)};`)
  .replace(
    /const OUT_FILE = .*;/,
    `const OUT_FILE = ${JSON.stringify(join(cache, "output.json"))};`,
  );
await writeFile(join(cache, "generator.ts"), cachedSource);
const body = source
  .slice(
    source.indexOf("const font = await loadFont();"),
    source.indexOf("await writeFile(OUT_FILE"),
  )
  .replace(
    "const font = await loadFont();",
    "const font = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));",
  );
await writeFile(
  join(cache, "oracle.ts"),
  `import * as opentype from "opentype.js";\nimport {svgPathProperties} from "svg-path-properties";\nconst TEXT="Aadit Agrawal", FONT_SIZE=100;\nexport function baseline(bytes: Uint8Array) {\n${body}\nreturn {text:TEXT,viewBox,letters};\n}\nexport function parse(bytes:Uint8Array){return opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));}\nexport function layout(font:opentype.Font){return font.getPaths(TEXT,0,FONT_SIZE,FONT_SIZE,{kerning:true});}\nexport function length(d:string){return new svgPathProperties(d).getTotalLength();}\n`,
);
const old = await import(join(cache, "oracle.ts"));
const bytes = new Uint8Array(await readFile(fontPath));
const expected = JSON.stringify(old.baseline(bytes));
if (JSON.stringify(generateSignature(bytes)) !== expected)
  throw new Error("Baseline/candidate output mismatch");
const font = new TrueTypeFont(bytes);
const oldFont = old.parse(bytes);
const oldPaths = old.layout(oldFont);
function layout() {
  let x = 0;
  return Array.from("Aadit Agrawal", (char) => {
    const glyph = font.glyphFor(char);
    const commands = glyph.contours.flatMap((contour) =>
      contourCommands(contour, x, 100, 100 / font.unitsPerEm),
    );
    x += (glyph.advanceWidth * 100) / font.unitsPerEm;
    return commands;
  });
}
const commands = layout();
const rows: {
  name: string;
  baseline: ReturnType<typeof measurements>;
  candidate: ReturnType<typeof measurements>;
}[] = [];
let checksum = 0;
function summary(values: number[]) {
  values.sort((a, b) => a - b);
  return {
    median_ms: values[Math.floor(values.length / 2)],
    p95_ms: values[Math.ceil(values.length * 0.95) - 1],
    min_ms: values[0],
    max_ms: values[values.length - 1],
  };
}
function measurements(wall: number[], cpu: number[]) {
  return { ...summary(wall), cpu: cpu.length ? summary(cpu) : null };
}
function measure(
  name: string,
  baseline: () => void,
  candidate: () => void,
  iterations = 1,
  cpu = true,
) {
  const before: number[] = [];
  const after: number[] = [];
  const beforeCpu: number[] = [];
  const afterCpu: number[] = [];
  const timed = (operation: () => void, wallTimes: number[], cpuTimes: number[]) => {
    const startCpu = process.cpuUsage();
    const start = performance.now();
    for (let i = 0; i < iterations; i++) operation();
    wallTimes.push((performance.now() - start) / iterations);
    const used = process.cpuUsage(startCpu);
    if (cpu) cpuTimes.push((used.user + used.system) / 1000 / iterations);
  };
  for (let i = 0; i < warmups; i++) {
    baseline();
    candidate();
  }
  for (let i = 0; i < samples; i++) {
    if (i % 2) {
      timed(candidate, after, afterCpu);
      timed(baseline, before, beforeCpu);
    } else {
      timed(baseline, before, beforeCpu);
      timed(candidate, after, afterCpu);
    }
  }
  const row = {
    name,
    baseline: measurements(before, beforeCpu),
    candidate: measurements(after, afterCpu),
  };
  rows.push(row);
  console.error(
    `${name}: ${row.baseline.median_ms.toFixed(4)} -> ${row.candidate.median_ms.toFixed(4)} ms median`,
  );
}
measure(
  "font parse",
  () => {
    checksum += old.parse(bytes).unitsPerEm;
  },
  () => {
    checksum += new TrueTypeFont(bytes).unitsPerEm;
  },
);
measure(
  "fixed-name layout",
  () => {
    checksum += old.layout(oldFont).length;
  },
  () => {
    checksum += layout().length;
  },
  10,
);
measure(
  "signature serialization",
  () => {
    for (const path of oldPaths) checksum += path.toPathData(2).length;
  },
  () => {
    for (const path of commands) checksum += pathData(path).length;
  },
  10,
);
const small: Command[] = [
  { type: "M", x: 0, y: 0 },
  { type: "Q", x1: 10, y1: 20, x: 20, y: 0 },
];
const large: Command[] = [{ type: "M", x: 0, y: 0 }];
for (let i = 0; i < 4000; i++) large.push({ type: "Q", x1: i % 2 ? -10 : 10, y1: 0, x: 0, y: 0 });
for (const [name, paths] of [
  ["small quadratic length", [small]],
  ["signature lengths", commands],
  ["4000 reversing cusp lengths", [large]],
] satisfies [string, Command[][]][]) {
  const strings = paths.map(pathData);
  for (let i = 0; i < paths.length; i++) {
    const baseline = old.length(strings[i]);
    const candidate = pathLength(paths[i]);
    if (
      !Number.isFinite(baseline) ||
      !Number.isFinite(candidate) ||
      Math.abs(baseline - candidate) > 0.00001
    ) {
      throw new Error(`Length mismatch in ${name}`);
    }
  }
  measure(
    name,
    () => {
      for (const d of strings) checksum += old.length(d);
    },
    () => {
      for (const path of paths) checksum += pathLength(path);
    },
    name.startsWith("small") ? 100 : 1,
  );
}
measure(
  "full generation",
  () => {
    checksum += JSON.stringify(old.baseline(bytes)).length;
  },
  () => {
    checksum += JSON.stringify(generateSignature(bytes)).length;
  },
);
if (!process.argv.includes("--in-process"))
  measure(
    "generator process including imports/read/write",
    () => {
      run([join(cache, "generator.ts")]);
    },
    () => {
      run([join(root, "scripts/generate-name-svg.ts")]);
    },
    1,
    false,
  );
const result = {
  base: BASE,
  runtime: {
    bun_node_compat: process.version,
    installed_node: execFileSync("node", ["--version"], { encoding: "utf8" }).trim(),
  },
  bun: Bun.version,
  machine: {
    platform: platform(),
    release: release(),
    arch: arch(),
    cpu: cpus()[0]?.model,
    cpu_count: cpus().length,
    starting_load: startingLoad,
    finishing_load: loadavg(),
  },
  font_sha256: "9341fda10adbfeb7efc94302b34507a3e227d7e7f5c432df3f5ac8753ff73d24",
  samples,
  warmups,
  order: "alternating",
  network_included: false,
  baseline: "git-show generator, only cached font and output paths redirected",
  checksum,
  rows,
};
await writeFile(join(cache, "results.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
