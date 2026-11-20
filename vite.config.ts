import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

/**
 * WhatsApp/Facebook necesitan la imagen de vista previa con la dirección completa.
 * Se toma PUBLIC_SITE_URL o, en Vercel, el dominio de producción del proyecto.
 */
const absoluteOgImage = (): Plugin => ({
  name: 'absolute-og-image',
  transformIndexHtml(html) {
    const site =
      process.env.PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
    return site ? html.replace('content="/og-image.jpg"', `content="${site.replace(/\/+$/, '')}/og-image.jpg"`) : html;
  }
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), absoluteOgImage()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          // Firebase en un archivo aparte: se cachea entre visitas.
          advancedChunks: {
            groups: [{ name: 'firebase', test: /node_modules[\\/]@?firebase/ }]
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
