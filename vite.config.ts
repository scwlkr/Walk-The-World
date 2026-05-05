import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleDevApiRequest } from './dev/helpers/devApiServer';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'wtw-dev-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (await handleDevApiRequest(req, res)) return;
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (await handleDevApiRequest(req, res)) return;
          next();
        });
      }
    }
  ]
});
