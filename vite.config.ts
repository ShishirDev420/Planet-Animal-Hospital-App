import clinicalHandler from './api/clinical';
import walletHandler from './api/wallet';
import assistantHandler from './api/assistant';
import careHandler from './api/care';
import prescriptionHandler, { MAX_REQUEST_BYTES } from './api/prescriptions';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  for (const [key,value] of Object.entries(env)) if (key.startsWith('CARE_') && process.env[key] === undefined) process.env[key] = value;
  return {
    plugins: [react(), tailwindcss(), {
      name: 'planet-care-service',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const endpoint = req.url?.split('?')[0];
          if (endpoint !== '/api/care' && endpoint !== '/api/prescriptions' && endpoint !== '/api/assistant' && endpoint !== '/api/wallet' && endpoint !== '/api/clinical') return next();
          let size = 0; const chunks: Buffer[] = [];
          for await (const chunk of req) {
            size += Buffer.byteLength(chunk);
            if (size > (endpoint === '/api/prescriptions' ? MAX_REQUEST_BYTES : endpoint === '/api/clinical' ? 45000 : 20000)) { res.statusCode = 413; res.end(JSON.stringify({error:'Request too large.'})); return; }
            chunks.push(Buffer.from(chunk));
          }
          (req as any).body = Buffer.concat(chunks).toString('utf8') || undefined;
          await (endpoint === '/api/prescriptions' ? prescriptionHandler : endpoint === '/api/assistant' ? assistantHandler : endpoint === '/api/wallet' ? walletHandler : endpoint === '/api/clinical' ? clinicalHandler : careHandler)(req, res);
        });
      },
    }],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/firebase')) return 'firebase';
            if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) return 'motion';
            if (id.includes('node_modules/@google/generative-ai') || id.includes('node_modules/@google/genai')) return 'ai-vendor';
            if (id.includes('node_modules/react-markdown') || id.includes('node_modules/jspdf')) return 'docs-vendor';
          },
        },
      },
    },
  };
});
