import type { Rule, Finding } from "./types.ts";
import { surfaceTokens } from "../tokens.ts";

export const tooManyTools: Rule = {
  id: "surface/too-many-tools",
  run(surface, ctx): Finding[] {
    const n = surface.tools.length;
    if (n <= ctx.config.maxTools) return [];
    return [{
      ruleId: this.id,
      severity: "error",
      message: `${n} tools exposed (budget ${ctx.config.maxTools}). Large surfaces hurt tool-selection accuracy; split or lazy-load.`,
    }];
  },
};

export const tokenBudget: Rule = {
  id: "surface/token-budget",
  run(surface, ctx): Finding[] {
    const total = surfaceTokens(surface);
    if (total <= ctx.config.tokenBudget) return [];
    return [{
      ruleId: this.id,
      severity: "error",
      tokens: total,
      message: `Tool surface costs ~${total} tokens/call (budget ${ctx.config.tokenBudget}). Trim descriptions/schemas or reduce tools.`,
    }];
  },
};
