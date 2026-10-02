import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import multer from 'multer';
import 'dotenv/config';

function aiAnalyzeDevPlugin(): Plugin {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
  });

  return {
    name: 'ai-analyze-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/analyze', (req: any, res: any, next: any) => {
        if (req.method !== 'POST') return next();

        upload.single('image')(req, res, async (err: any) => {
          if (err) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message || 'File upload failed' }));
          }

          if (!req.file) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'No image file uploaded' }));
          }

          const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

          const formData = new FormData();
          const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'image/jpeg' });
          formData.append('file', blob, req.file.originalname || 'waste_image.jpg');

          try {
            const apiRes = await fetch(`${aiServiceUrl}/analyze`, {
              method: 'POST',
              body: formData,
            });

            const data = await apiRes.json();
            res.statusCode = apiRes.status;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(data));
          } catch (networkErr: any) {
            console.error('Failed to reach AI service from Vite dev server:', networkErr);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                error: 'AI service unreachable',
                message: `Could not connect to AI service at ${aiServiceUrl}. Please ensure the Python FastAPI service is running.`,
              })
            );
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aiAnalyzeDevPlugin()],
    envPrefix: ['VITE_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
