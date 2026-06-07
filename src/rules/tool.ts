import type { Rule, Finding } from "./types.ts";
import type { JSONSchema, ToolDef } from "../model.ts";
import { estimateTokens } from "../tokens.ts";

function words(s: string | undefined): number {
  return s ? s.trim().split(/\s+/).filter(Boolean).length : 0;
}

function schemaDepth(schema: JSONSchema | undefined, depth = 1): number {
  if (!schema || typeof schema !== "object") return depth;
  let max = depth;
  if (schema.properties) {
    for (const v of Object.values(schema.properties)) max = Math.max(max, schemaDepth(v, depth + 1));
  }
  if (schema.items) {
    const items = Array.isArray(schema.items) ? schema.items : [schema.items];
    for (const v of items) max = Math.max(max, schemaDepth(v, depth + 1));
  }
  return max;
}

function* properties(schema: JSONSchema | undefined): Generator<[string, JSONSchema]> {
  if (!schema?.properties) return;
  for (const [k, v] of Object.entries(schema.properties)) yield [k, v];
}

function perTool(id: string, severity: "error" | "warn" | "info", check: (t: ToolDef, ctx: import("./types.ts").RuleContext) => string | null): Rule {
  return {
    id,
    run(surface, ctx): Finding[] {
      const out: Finding[] = [];
      for (const t of surface.tools) {
        const msg = check(t, ctx);
        if (msg) out.push({ ruleId: id, severity, tool: t.name, message: msg });
      }
      return out;
    },
  };
}

export const toolRules: Rule[] = [
  perTool("tool/missing-description", "error", (t) => (words(t.description) === 0 ? "No description. Agents can't choose a tool they can't understand." : null)),
  perTool("tool/description-too-short", "warn", (t, ctx) => (words(t.description) > 0 && words(t.description) < ctx.config.minDescriptionWords ? `Description is ${words(t.description)} words (<${ctx.config.minDescriptionWords}). Add purpose + when to use it.` : null)),
  perTool("tool/description-too-long", "info", (t, ctx) => (words(t.description) > ctx.config.maxDescriptionWords ? `Description is ${words(t.description)} words (>${ctx.config.maxDescriptionWords}). Trim to cut per-call token cost.` : null)),
  perTool("tool/no-examples", "info", (t, ctx) => (words(t.description) >= ctx.config.maxDescriptionWords && t.description && !/e\.g\.|example|for instance|\bex:/i.test(t.description) ? "No usage example in the description; a short example improves tool selection." : null)),
  perTool("tool/schema-too-large", "warn", (t, ctx) => {
    if (!t.inputSchema) return null;
    const n = estimateTokens(JSON.stringify(t.inputSchema));
    return n > ctx.config.maxToolSchemaTokens ? `Input schema is ~${n} tokens (>${ctx.config.maxToolSchemaTokens}). Simplify or split.` : null;
  }),
  perTool("tool/schema-deeply-nested", "warn", (t, ctx) => {
    const d = schemaDepth(t.inputSchema);
    return d > ctx.config.maxSchemaDepth ? `Input schema nests ${d} levels (>${ctx.config.maxSchemaDepth}). Flatten for reliability.` : null;
  }),
  perTool("tool/param-missing-description", "warn", (t) => {
    const missing = [...properties(t.inputSchema)].filter(([, v]) => !v.description).map(([k]) => k);
    return missing.length ? `Parameters lack descriptions: ${missing.join(", ")}.` : null;
  }),
  perTool("tool/freeform-should-enum", "info", (t) => {
    const candidates = [...properties(t.inputSchema)].filter(([, v]) => v.type === "string" && !v.enum && /one of|must be one of|: *(?:[a-z]+ *\| *){2,}/i.test(v.description ?? "")).map(([k]) => k);
    return candidates.length ? `String params imply a fixed set; use enum: ${candidates.join(", ")}.` : null;
  }),
  perTool("tool/unclear-name", "info", (t) => (/^(tool|fn|do|run|action)\d*$/i.test(t.name) || t.name.length < 3 ? `Name "${t.name}" is non-descriptive; rename to a verb_object.` : null)),
];
