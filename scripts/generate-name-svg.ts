/** Regenerate the hero's Sacramento signature with `bun scripts/generate-name-svg.ts`. */
import { readFile, writeFile } from "node:fs/promises";
import { generateSignature } from "./signature";

const font = await readFile(new URL("./fonts/Sacramento-Regular.ttf", import.meta.url));
const signature = generateSignature(font);
const output = new URL("../src/components/name-paths.json", import.meta.url);
await writeFile(output, JSON.stringify(signature, null, "\t") + "\n");
console.log(
  `Wrote ${signature.letters.length} letters to ${output.pathname} (viewBox ${signature.viewBox})`,
);
