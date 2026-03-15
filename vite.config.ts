import { defineConfig } from 'vite';
export default defineConfig({
  build: { target: 'es2022' },
  server: { open: true },
  resolve: {
    alias: {
      '@engine': '/src/engine',
      '@types': '/src/types',
      '@utils': '/src/utils',
      '@data': '/src/data',
    }
  }
});
