import { test } from "node:test";
import assert from "node:assert/strict";
import { tooManyTools, tokenBudget } from "../src/rules/surface.ts";
import { makeContext } from "../src/rules/types.ts";
import { mergeConfig } from "../src/config.ts";
import type { Surface } from "../src/model.ts";

function surfaceOf(n: number): Surface {
  return { tools: Array.from({ length: n }, (_, i) => ({ name: `tool_${i}`, description: "does a thing well enough for tests" })) };
}

test("tooManyTools fires above threshold", () => {
  const ctx = makeContext(mergeConfig({ maxTools: 5 }));
  assert.equal(tooManyTools.run(surfaceOf(6), ctx).length, 1);
  assert.equal(tooManyTools.run(surfaceOf(5), ctx).length, 0);
});

test("tokenBudget fires when surface exceeds budget", () => {
  const ctx = makeContext(mergeConfig({ tokenBudget: 1 }));
  const findings = tokenBudget.run(surfaceOf(3), ctx);
  assert.equal(findings.length, 1);
  assert.ok(findings[0]!.tokens! > 1);
});
