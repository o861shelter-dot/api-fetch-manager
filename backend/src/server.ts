/**
 * server.ts — Entry point backend (Fastify). Serve API + static FE build.
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { createContext } from './context.js';
import { registerRoutes } from './routes/routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function buildServer() {
  const ctx = createContext();
  const app = Fastify({ logger: { level: ctx.config.logLevel } });

  await app.register(cors, { origin: true });
  registerRoutes(app, ctx);

  // Serve FE build tĩnh (public/) nếu tồn tại (chế độ 1 image Docker).
  const publicDir = join(__dirname, '..', 'public');
  if (existsSync(publicDir)) {
    await app.register(fastifyStatic, { root: publicDir, prefix: '/' });
    app.setNotFoundHandler((req, reply) => {
      // SPA fallback: request không phải /api → trả index.html.
      if (req.url.startsWith('/api')) return reply.code(404).send({ ok: false, error: 'Not found' });
      return reply.sendFile('index.html');
    });
  }

  return { app, ctx };
}

async function main() {
  const { app, ctx } = await buildServer();
  try {
    await app.listen({ port: ctx.config.port, host: '0.0.0.0' });
    // eslint-disable-next-line no-console
    console.log(`[server] API Fetch Manager chạy tại :${ctx.config.port} (storage=${ctx.config.storageMode})`);
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
}

// Chạy khi gọi trực tiếp.
if (process.argv[1] && process.argv[1].endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  main();
}
