/**
 * Anthropic model pricing in USD per million tokens.
 * Source: anthropic.com/pricing — update when prices change.
 *
 * If a model isn't listed, costUsd returns 0 rather than throwing.
 * Under-reporting is preferable to crashing a parse on a price-table
 * miss; the model column on the event row makes the gap auditable.
 */
export interface Usage {
    input_tokens: number;
    output_tokens: number;
}
export declare function costUsd(model: string, usage: Usage): number;
