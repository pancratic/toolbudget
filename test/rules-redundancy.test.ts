import { test } from "node:test";
import assert from "node:assert/strict";
import { nearDuplicate } from "../src/rules/redundancy.ts";
import { makeContext } from "../src/rules/types.ts";
import { mergeConfig } from "../src/config.ts";

test("near-duplicate tools are flagged", () => {
  const ctx = makeContext(mergeConfig({ similarityThreshold: 0.6 }));
  const surface = { tools: [
    { name: "search_web", description: "Search the web for a query" },
    { name: "web_search", description: "Search the web for a query" },
    { name: "delete_file", description: "Remove a file from disk permanently" },
  ] };
  const f = nearDuplicate.run(surface, ctx);
  assert.equal(f.length, 1);
  assert.match(f[0]!.message, /search_web/);
});
