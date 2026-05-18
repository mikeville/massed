import { defineConfig } from 'vitest/config';
import { loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { parseWorkout } from './server/parseWorkout';

declare const process: { cwd(): string };

// Narrow shapes for the bits of Node http we actually use. Avoids
// pulling @types/node just to wire one dev middleware.
interface NodeReqLike {
  method?: string;
  on(event: 'data', cb: (chunk: Uint8Array) => void): void;
  on(event: 'end', cb: () => void): void;
  on(event: 'error', cb: (err: Error) => void): void;
}
interface NodeResLike {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

/**
 * Dev-only middleware that handles POST /api/parse-workout by calling
 * the shared `parseWorkout` handler. The API key never leaves Node —
 * the plugin's `configureServer` hook runs in the Vite dev process and
 * nothing in here is bundled into the client.
 *
 * For deploy, the same `server/parseWorkout.ts` module re-exports as
 * a Netlify function with no code change; this plugin only exists to
 * mirror that endpoint in `npm run dev`.
 */
function parseWorkoutDevPlugin(apiKey: string): Plugin {
  return {
    name: 'massed:parse-workout-dev',
    configureServer(server) {
      server.middlewares.use('/api/parse-workout', async (rawReq, rawRes) => {
        const req = rawReq as unknown as NodeReqLike;
        const res = rawRes as unknown as NodeResLike;
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'method not allowed' }));
          return;
        }
        try {
          const body = await readJson(req);
          const transcript =
            typeof (body as { transcript?: unknown }).transcript === 'string'
              ? ((body as { transcript: string }).transcript)
              : '';
          const out = await parseWorkout({ transcript, apiKey });
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(out));
        } catch (e) {
          const message = e instanceof Error ? e.message : 'unknown error';
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

function readJson(req: NodeReqLike): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const buf = chunks.length === 1 ? chunks[0] : concat(chunks);
        const text = new TextDecoder().decode(buf);
        resolve(text ? JSON.parse(text) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function concat(chunks: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const c of chunks) len += c.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.ANTHROPIC_API_KEY ?? '';
  return {
    plugins: [react(), parseWorkoutDevPlugin(apiKey)],
    server: { port: 5173 },
    css: {
      modules: {
        // BEM-style names like `.checkin__top` are exposed to JS as `checkinTop`,
        // keeping the source CSS readable while module access stays ergonomic.
        localsConvention: 'camelCaseOnly',
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
