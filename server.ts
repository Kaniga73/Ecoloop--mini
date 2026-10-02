import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import 'dotenv/config';
import multer from 'multer';

// Determine dirname safely across ESM and CommonJS
const getCurrentDir = () => {
  try {
    if (typeof __dirname !== 'undefined') return __dirname;
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return process.cwd();
  }
};
const appDir = getCurrentDir();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 4000);

  app.use(express.json());

  // Health and Auth API endpoints
  app.get('/api/health', (_req: any, res: any) => {
    res.json({
      status: 'ok',
      service: 'EcoLoop Authentication Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/auth/status', (_req: any, res: any) => {
    res.json({
      configured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
      sessionDuration: '7 days',
      architecture: 'Supabase Authentication & Unified Account Model',
    });
  });

  // Open-source CLIP AI Analysis route
  app.post('/api/analyze', upload.single('image'), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'image/jpeg' });
      formData.append('file', blob, req.file.originalname || 'waste_image.jpg');

      let response: any;
      try {
        response = await fetch(`${aiServiceUrl}/analyze`, {
          method: 'POST',
          body: formData,
        });
      } catch (networkErr: any) {
        console.error('Failed to reach AI service:', networkErr);
        return res.status(500).json({
          error: 'AI service unreachable',
          message: `Could not connect to AI service at ${aiServiceUrl}. Please ensure the Python FastAPI service is running.`,
        });
      }

      if (!response.ok) {
        let errorDetails: any;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }
        return res.status(502).json({
          error: 'AI service error',
          details: errorDetails,
        });
      }

      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error('Unexpected error in /api/analyze:', err);
      return res.status(500).json({
        error: 'Internal server error',
        message: err?.message || 'An unexpected error occurred while analyzing image.',
      });
    }
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
    app.get('*', (_req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoLoop Authentication Server listening on port ${PORT}`);
    console.log(`➜  Local:   http://localhost:${PORT}/`);
  });
}

startServer();
