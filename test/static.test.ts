import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadStaticSurface } from "../src/introspect/static.ts";

const fx = (n: string) => fileURLToPath(new URL(`./fixtures/${n}`, import.meta.url));

test("loads a tools.json into a Surface", async () => {
  const s = await loadStaticSurface(fx("lean.tools.json"));
  assert.equal(s.tools.length, 1);
  assert.equal(s.tools[0]!.name, "search_web");
});

test("accepts a bare array or {tools:[...]} and rejects garbage", async () => {
  await assert.rejects(() => loadStaticSurface(fx("does-not-exist.json")));
});
