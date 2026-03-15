import { defineConfig } from 'vitest/config';
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
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/utils/**'],
    },
  },
});
