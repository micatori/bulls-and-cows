import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', // ядро не знает про DOM → тесты максимально быстрые
    include: ['tests/**/*.test.ts'],
    passWithNoTests: true, // допустимо на первом коммите, дальше не мешает
  },
});
