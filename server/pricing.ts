/**
 * Anthropic model pricing in USD per million tokens.
 * Source: anthropic.com/pricing — update when prices change.
 *
 * If a model isn't listed, costUsd returns 0 rather than throwing.
 * Under-reporting is preferable to crashing a parse on a price-table
 * miss; the model column on the event row makes the gap auditable.
 */

interface ModelPricing {
  readonly inputPerMtok: number;
  readonly outputPerMtok: number;
}

const PRICING: Record<string, ModelPricing> = {
  'claude-haiku-4-5': { inputPerMtok: 1.0, outputPerMtok: 5.0 },
};

export interface Usage {
  input_tokens: number;
  output_tokens: number;
}

export function costUsd(model: string, usage: Usage): number {
  const p = PRICING[model];
  if (!p) return 0;
  const inCost = (usage.input_tokens / 1_000_000) * p.inputPerMtok;
  const outCost = (usage.output_tokens / 1_000_000) * p.outputPerMtok;
  // Match the numeric(10,6) precision of parse_events.cost_usd.
  return Math.round((inCost + outCost) * 1_000_000) / 1_000_000;
}
