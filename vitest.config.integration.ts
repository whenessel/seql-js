/// <reference types="vitest/config" />
import { defineConfig, mergeConfig } from 'vitest/config';
// @ts-ignore
import defaultConfig from './vitest.config.default';

export default mergeConfig(
  defaultConfig,
  defineConfig({
    test: {
      reporters: [['junit', { outputFile: '.test-results/integration-results.xml' }]],
      coverage: {
        provider: 'v8',
        reporter: ['lcov'],
        reportsDirectory: '.coverage/integration/',
        thresholds: {
          statements: 70,
          branches: 60,
          functions: 65,
          lines: 70,
        },
      },
      name: { label: 'integration', color: 'cyan' },
      environment: 'jsdom',
      include: ['tests/integration/**/*.test.ts'],
      exclude: ['tests/unit/**/*'],
    },
  })
);
