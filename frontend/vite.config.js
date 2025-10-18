import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

const enableBundleAnalyzer = process.env.BUNDLE_ANALYZE === 'true';

export default defineConfig({
  plugins: [
    react(),
    enableBundleAnalyzer &&
      visualizer({
        filename: 'dist/bundle-report.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true
      })
  ].filter(Boolean),
  build: {
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('react-router')) {
            return 'vendor-react-router';
          }

          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }

          if (id.includes('framer-motion')) {
            return 'vendor-framer';
          }

          if (id.includes('socket.io-client')) {
            return 'vendor-socket';
          }

          if (id.includes('zustand')) {
            return 'vendor-state';
          }

          if (id.includes('axios')) {
            return 'vendor-axios';
          }

          return 'vendor';
        }
      }
    },
    chunkSizeWarningLimit: 700
  }
});
