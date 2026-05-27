import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Connect, type Plugin} from 'vite';

function readRequestBody(req: Connect.IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function getSarvamKey(env: Record<string, string>, req: Connect.IncomingMessage) {
  const headerKey = req.headers['x-sarvam-api-key'];
  const clientKey = Array.isArray(headerKey) ? headerKey[0] : headerKey;
  return (
    clientKey ||
    env.SARVAM_API_KEY ||
    env.SARVAM_API_SUBSCRIPTION_KEY ||
    env.SERUM_API_KEY ||
    env.SERUM_API_SUBSCRIPTION_KEY ||
    env.API_SUBSCRIPTION_KEY ||
    env.VITE_SARVAM_API_KEY ||
    env.VITE_SARVAM_API_SUBSCRIPTION_KEY ||
    env.VITE_SERUM_API_KEY ||
    env.VITE_SERUM_API_SUBSCRIPTION_KEY ||
    ''
  ).trim();
}

function sarvamProxyPlugin(env: Record<string, string>): Plugin {
  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    if (!req.url?.startsWith('/api/sarvam/')) {
      next();
      return;
    }

    const apiKey = getSarvamKey(env, req);
    const isConfigured = Boolean(apiKey) && !/your_|paste_|placeholder/i.test(apiKey);

    if (req.url.startsWith('/api/sarvam/status')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ configured: isConfigured }));
      return;
    }

    if (!isConfigured) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Sarvam API key is not configured on the local server.' }));
      return;
    }

    try {
      const body = await readRequestBody(req);
      const isTts = req.url.startsWith('/api/sarvam/text-to-speech');
      const upstreamUrl = isTts
        ? 'https://api.sarvam.ai/text-to-speech'
        : 'https://api.sarvam.ai/v1/speech-to-text';
      const contentType = req.headers['content-type'];

      const upstream = await fetch(upstreamUrl, {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey,
          ...(contentType ? { 'Content-Type': String(contentType) } : {}),
        },
        body,
        duplex: 'half',
      } as RequestInit & { duplex: 'half' });

      const responseBody = Buffer.from(await upstream.arrayBuffer());
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      res.end(responseBody);
    } catch (error) {
      console.error('Sarvam proxy error:', error);
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Sarvam request failed from the local server.' }));
    }
  };

  return {
    name: 'planet-sarvam-proxy',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), sarvamProxyPlugin(env)],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
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
