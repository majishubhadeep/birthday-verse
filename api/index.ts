import '../src/server/envSanitizer.ts';
import express from 'express';
import { apiRouter } from '../src/server/routes.ts';
import { initDatabase } from '../src/server/db.ts';

const app = express();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mount API router for both /api/path and /path rewrite patterns
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Initialize database connection
initDatabase().catch((err) => {
  console.error('[Vercel DB Init Error]', err);
});

export default app;
