import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

test("stale responses return immediately while refresh and cache writes keep the worker alive", async () => {
  let fetchListener;
  let finishFetch;
  let finishWrite;
  const hit = { cached: true };
  const cache = {
    match: async () => hit,
    put: () =>
      new Promise((resolve) => {
        finishWrite = resolve;
      }),
  };
  runInNewContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), {
    URL,
    self: {
      location: { origin: "https://example.test" },
      addEventListener(type, listener) {
        if (type === "fetch") fetchListener = listener;
      },
    },
    caches: { open: async () => cache },
    fetch: () =>
      new Promise((resolve) => {
        finishFetch = resolve;
      }),
  });
  let response;
  let lifetime;
  fetchListener({
    request: { method: "GET", url: "https://example.test/" },
    respondWith(promise) {
      response = promise;
    },
    waitUntil(promise) {
      lifetime = promise;
    },
  });
  expect(await response).toBe(hit);
  let settled = false;
  lifetime.then(() => {
    settled = true;
  });
  await Bun.sleep(0);
  expect(settled).toBe(false);
  finishFetch({ ok: true, clone: () => ({ fresh: true }) });
  await Bun.sleep(0);
  expect(settled).toBe(false);
  finishWrite();
  await lifetime;
  expect(settled).toBe(true);
});
