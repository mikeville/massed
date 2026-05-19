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
const FAMILY_VALUES = [
    'hinge',
    'squat',
    'pushH',
    'pullH',
    'pushV',
    'pullV',
    'iso',
];
// Haiku 4.5 is the right tier: structured parse, short context, latency
// matters because the user is staring at a spinner.
const MODEL = 'claude-haiku-4-5';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
// Keep this short. Haiku doesn't need the full FAMILY_LOOKUP — it
// generalizes from a handful of examples per category.
const SYSTEM_PROMPT = `you parse natural-language workout descriptions into structured data. call the record_workout tool with one row per individual set, in the order the user said them.

family codes (movement pattern):
- hinge: deadlift, rdl, good morning, hip thrust, swing, back extension
- squat: back squat, front squat, lunge, leg press, split squat, step up
- pushH: bench press, incline bench, dip, pushup, chest press, floor press
- pullH: barbell row, cable row, face pull, seal row, chest-supported row
- pushV: overhead press, shoulder press, push press, military press, arnold press
- pullV: pullup, chinup, lat pulldown
- iso: curl, lateral raise, tricep extension, calf raise, fly, leg curl, leg extension, shrug, plank, crunch

rules:
- one row per individual set. expand "3 sets of 5 at 185" into 3 rows, each {name, family, reps:5, weight:185}.
- "5, 5, 3 at 185" expands to 3 rows: reps 5/5/3 at weight 185.
- preserve chronological order. if the user supersets bench/squat/bench, return 3 rows in that order, not grouped.
- weight unit is pounds. if the user says kg, multiply by 2.205 and round to the nearest 5.
- if a rep range is given (e.g. "5 to 7"), use the middle value.
- if no weight is mentioned for a bodyweight movement (pushup, pullup, dip, chinup), use 0.
- "to failure" — use reps:0 so the user can correct it.
- preserve the user's exercise name as spoken (don't normalize "bench" to "bench press").`;
const TOOL_SCHEMA = {
    name: 'record_workout',
    description: 'Record the parsed workout as a flat chronological list of set rows.',
    input_schema: {
        type: 'object',
        properties: {
            rows: {
                type: 'array',
                description: 'One row per individual set, in the order the user said them.',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Exercise name as the user said it.' },
                        family: {
                            type: 'string',
                            enum: [...FAMILY_VALUES],
                            description: 'Movement pattern code.',
                        },
                        reps: { type: 'number', description: 'Number of reps in this set.' },
                        weight: { type: 'number', description: 'Weight in pounds.' },
                    },
                    required: ['name', 'family', 'reps', 'weight'],
                },
            },
        },
        required: ['rows'],
    },
};
export async function parseWorkout({ transcript, apiKey, }) {
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not set on the server.');
    }
    const trimmed = transcript.trim();
    if (!trimmed) {
        throw new Error('transcript is empty.');
    }
    const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            tools: [TOOL_SCHEMA],
            tool_choice: { type: 'tool', name: 'record_workout' },
            messages: [{ role: 'user', content: trimmed }],
        }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`anthropic ${res.status}: ${body || res.statusText}`);
    }
    // The response has a `content` array. With tool_choice forced, we
    // expect a single tool_use block. `usage` rides alongside for cost
    // accounting.
    const data = (await res.json());
    const toolBlock = data.content?.find((b) => b.type === 'tool_use' && b.name === 'record_workout');
    if (!toolBlock || !toolBlock.input) {
        throw new Error('model did not call the record_workout tool.');
    }
    const usage = {
        input_tokens: data.usage?.input_tokens ?? 0,
        output_tokens: data.usage?.output_tokens ?? 0,
    };
    return { workout: validate(toolBlock.input), usage, model: MODEL };
}
/**
 * Narrow unknown → ParsedWorkout. The schema is enforced server-side
 * by Anthropic's tool input_schema, but we still validate defensively
 * — the model can occasionally return out-of-enum families.
 */
function validate(input) {
    if (!isRecord(input) || !Array.isArray(input.rows)) {
        throw new Error('parsed shape is invalid (missing rows).');
    }
    const rows = [];
    for (const raw of input.rows) {
        if (!isRecord(raw))
            continue;
        const name = typeof raw.name === 'string' ? raw.name.trim() : '';
        const family = isFamily(raw.family) ? raw.family : null;
        const reps = typeof raw.reps === 'number' && Number.isFinite(raw.reps) ? raw.reps : null;
        const weight = typeof raw.weight === 'number' && Number.isFinite(raw.weight) ? raw.weight : null;
        if (!name || !family || reps === null || weight === null)
            continue;
        if (reps < 0 || weight < 0)
            continue;
        rows.push({ name, family, reps, weight });
    }
    return { rows };
}
function isRecord(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isFamily(v) {
    return typeof v === 'string' && FAMILY_VALUES.includes(v);
}
