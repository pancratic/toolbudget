import type { Rule, Finding } from "./types.ts";
import type { ToolDef } from "../model.ts";

function tokenize(t: ToolDef): Set<string> {
  return new Set(`${t.name} ${t.description ?? ""}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export const nearDuplicate: Rule = {
  id: "redundancy/near-duplicate-tools",
  run(surface, ctx): Finding[] {
    const out: Finding[] = [];
    const toks = surface.tools.map(tokenize);
    for (let i = 0; i < surface.tools.length; i++) {
      for (let j = i + 1; j < surface.tools.length; j++) {
        if (jaccard(toks[i]!, toks[j]!) >= ctx.config.similarityThreshold) {
          out.push({
            ruleId: this.id,
            severity: "warn",
            message: `"${surface.tools[i]!.name}" and "${surface.tools[j]!.name}" look near-duplicate; merge to reduce surface and ambiguity.`,
          });
        }
      }
    }
    return out;
  },
};
