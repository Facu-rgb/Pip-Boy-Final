import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  plugins: [],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    rollupOptions: { input: path.resolve(import.meta.dirname, './index.html') },
    outDir: path.resolve(import.meta.dirname, './dist/public'),
    emptyOutDir: true,
  },
  server: { allowedHosts: true, fs: { allow: [path.resolve(import.meta.dirname)] } },
});
