import './src/server/envSanitizer.ts';
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/routes.ts';
import { initDatabase } from './src/server/db.ts';
import { config } from './src/server/config.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = config.port;

  // JSON and Form parser
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Static directory for public assets (uploads, photos, etc.)
  app.use(express.static(path.resolve(process.cwd(), 'public')));

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Initialize persistent database
  initDatabase().catch((err) => {
    console.error('[Database] Async init error:', err);
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode: Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Birthday Verse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
