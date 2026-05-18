/**
 * server/parseWorkout — the only network call this app makes.
 *
 * Takes a free-text workout description, returns the structured shape
 * the app already uses (one ExerciseEntry-shaped object per movement,
 * each with one or more sets). The model is forced through a tool call
 * so the response is guaranteed JSON rather than prose.
 *
 * Pure handler: no env access, no framework wiring. The caller (the
 * Vite dev middleware in vite.config.ts today, a Netlify function
 * later) passes the API key in.
 */
/**
 * Family — duplicated from src/lib/types.ts so this module stays in
 * the Node-only tsconfig project without crossing project boundaries.
 * If the canonical type drifts, update both.
 */
type Family = 'hinge' | 'squat' | 'pushH' | 'pullH' | 'pushV' | 'pullV' | 'iso';
export interface ParsedRow {
    name: string;
    family: Family;
    reps: number;
    weight: number;
}
export interface ParsedWorkout {
    rows: ParsedRow[];
}
interface ParseInput {
    transcript: string;
    apiKey: string;
}
export declare function parseWorkout({ transcript, apiKey, }: ParseInput): Promise<ParsedWorkout>;
export {};
