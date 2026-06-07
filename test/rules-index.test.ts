import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_RULES } from "../src/rules/index.ts";

test("registry has unique rule ids and includes the key rules", () => {
  const ids = ALL_RULES.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ["surface/too-many-tools", "surface/token-budget", "tool/missing-description", "redundancy/near-duplicate-tools"]) {
    assert.ok(ids.includes(id), `missing ${id}`);
  }
});
