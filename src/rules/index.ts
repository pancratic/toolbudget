import type { Rule } from "./types.ts";
import { tooManyTools, tokenBudget } from "./surface.ts";
import { toolRules } from "./tool.ts";
import { nearDuplicate } from "./redundancy.ts";

export const ALL_RULES: Rule[] = [tooManyTools, tokenBudget, ...toolRules, nearDuplicate];
