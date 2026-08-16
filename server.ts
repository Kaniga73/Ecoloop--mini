import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 4000);

  app.use(express.json());

  // Health and Auth API endpoints
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'EcoLoop Authentication Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/auth/status', (_req, res) => {
    res.json({
      configured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
      sessionDuration: '7 days',
      architecture: 'Supabase Authentication & Unified Account Model',
    });
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoLoop Authentication Server listening on port ${PORT}`);
    console.log(`➜  Local:   http://localhost:${PORT}/`);
  });
}

startServer();
