import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [preact()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        content: resolve(__dirname, 'src/content/content-bundled.ts'),
        background: resolve(__dirname, 'src/background/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.html') {
            return 'popup.html';
          }
          return '[name].[ext]';
        },
        format: 'es', // ES modules format
        manualChunks: (id) => {
          // Split vendor code into separate chunks
          if (id.includes('node_modules')) {
            // Split large libraries into their own chunks
            if (id.includes('preact')) {
              return 'vendor-preact';
            }
            if (id.includes('pdf')) {
              return 'vendor-pdf';
            }
            // All other node_modules go into vendor chunk
            return 'vendor';
          }

          // Split AI providers into separate chunks for lazy loading
          if (id.includes('src/utils/gemini.ts')) {
            return 'provider-gemini';
          }
          if (id.includes('src/utils/claude.ts')) {
            return 'provider-claude';
          }
          if (id.includes('src/utils/groq.ts')) {
            return 'provider-groq';
          }
          if (id.includes('src/utils/chromeai.ts')) {
            return 'provider-chromeai';
          }
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    // Increase chunk size warning limit since we're splitting chunks
    chunkSizeWarningLimit: 600
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});