import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  resolve: {
    alias: {
      doclens: resolve(__dirname, '../src/index.ts'),
      'doclens/core': resolve(__dirname, '../src/core.ts'),
      '@core': resolve(__dirname, '../src/core'),
      '@react': resolve(__dirname, '../src/react'),
    },
  },
  server: {
    port: 3200,
  },
});
