/// <reference types="vitest/config" />
import { defineConfig, mergeConfig } from 'vitest/config';
// @ts-ignore
import defaultConfig from './vitest.config.default';

export default mergeConfig(
  defaultConfig,
  defineConfig({
    test: {
      reporters: [['verbose', {}]],
      name: { label: 'benchmark', color: 'cyan' },
      environment: 'jsdom',
      include: ['tests/benchmark/**/*.bench.ts'],
      exclude: ['tests/unit/**/*', 'tests/integration/**/*'],
      // Benchmark tests can be slower
      testTimeout: 30000, // 30 seconds
      // No coverage for benchmark tests
      coverage: {
        enabled: false,
      },
    },
  })
);
