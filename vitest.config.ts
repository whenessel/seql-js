/// <reference types="vitest/config" />
import { defineConfig, mergeConfig } from 'vitest/config';
// @ts-ignore
import defaultConfig from './vitest.config.default';

export default mergeConfig(
  defaultConfig,
  defineConfig({
    test: {
      reporters: [['junit', { outputFile: '.test-results/total-results.xml' }]],
      coverage: {
        provider: 'v8',
        reporter: ['lcov'],
        reportsDirectory: '.coverage/total/',
      },
      projects: ['./vitest.config.unit.ts', './vitest.config.integration.ts'],
      setupFiles: ['./vitest.setup.ts'],
      testTimeout: 10000,
    },
  })
);
