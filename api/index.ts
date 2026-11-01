import '../src/server/envSanitizer.ts';
import express from 'express';
import { apiRouter } from '../src/server/routes.ts';
import { ensureDatabaseInitialized } from '../src/server/db.ts';

const app = express();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Await database initialization before serving serverless API requests
app.use(async (_req, _res, next) => {
  await ensureDatabaseInitialized().catch((err) => {
    console.error('[Vercel DB Init Middleware Error]', err);
  });
  next();
});

// Mount API router for both /api/path and /path rewrite patterns
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
