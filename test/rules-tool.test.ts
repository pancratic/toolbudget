import { test } from "node:test";
import assert from "node:assert/strict";
import { toolRules } from "../src/rules/tool.ts";
import { makeContext } from "../src/rules/types.ts";
import { DEFAULT_CONFIG, mergeConfig } from "../src/config.ts";
import type { Surface } from "../src/model.ts";

function run(surface: Surface, cfg = DEFAULT_CONFIG) {
  const ctx = makeContext(cfg);
  return toolRules.flatMap((r) => r.run(surface, ctx));
}

test("missing description fires", () => {
  const f = run({ tools: [{ name: "a" }] });
  assert.ok(f.some((x) => x.ruleId === "tool/missing-description" && x.tool === "a"));
});

test("too-short description fires", () => {
  const f = run({ tools: [{ name: "a", description: "short one" }] });
  assert.ok(f.some((x) => x.ruleId === "tool/description-too-short"));
});

test("param missing description fires", () => {
  const f = run({ tools: [{ name: "a", description: "a sufficiently long and clear description for the tool here", inputSchema: { type: "object", properties: { q: { type: "string" } } } }] });
  assert.ok(f.some((x) => x.ruleId === "tool/param-missing-description"));
});

test("deeply nested schema fires", () => {
  const cfg = mergeConfig({ maxSchemaDepth: 2 });
  const deep = { type: "object", properties: { a: { type: "object", properties: { b: { type: "object", properties: { c: { type: "string" } } } } } } };
  const f = run({ tools: [{ name: "a", description: "a sufficiently long and clear description for the tool here", inputSchema: deep }] }, cfg);
  assert.ok(f.some((x) => x.ruleId === "tool/schema-deeply-nested"));
});

test("clean tool produces no tool-level findings", () => {
  const f = run({ tools: [{ name: "search_web", description: "Search the public web for a query and return the top ranked result snippets.", inputSchema: { type: "object", properties: { query: { type: "string", description: "The search query text." } }, required: ["query"] } }] });
  assert.equal(f.length, 0);
});
