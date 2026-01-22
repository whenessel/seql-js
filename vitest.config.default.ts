/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    mockReset: true,
    restoreMocks: true,
    include: ['tests/**/*.test.ts'],
    reporters: [
      'default',
      // "verbose",
      // ["junit", { outputFile: "test-results/junit/results.xml" }],
      // ["json", { outputFile: "test-results/json/results.json" }],
      // ["html", { outputFile: "test-results/html/index.html" }],
    ],
    coverage: {
      provider: 'v8',
      reporter: [
        // "lcov",
        'text',
        // "text-summary",
        // "text-lcov",
        // "json",
        // "json-summary",
        // "html",
        // "html-spa",
        // "clover",
        // "cobertura",
        // "lcovonly",
      ],
      include: ['src/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/**',
        '**/src/index.ts',
        '**/src/types/**',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        statements: 95,
        branches: 85,
        functions: 90,
        lines: 95,
      },
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
