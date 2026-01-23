/// <reference types="vitest/config" />
import { defineConfig, mergeConfig } from 'vitest/config';
// @ts-ignore
import defaultConfig from './vitest.config.default';

export default mergeConfig(
  defaultConfig,
  defineConfig({
    test: {
      reporters: [['junit', { outputFile: '.test-results/unit-results.xml' }]],
      coverage: {
        provider: 'v8',
        reporter: ['lcov'],
        reportsDirectory: '.coverage/unit/',
        exclude: [
          '**/index.ts', // Re-export файлы
          '**/*.d.ts', // TypeScript type definitions
          '**/types/**', // Типы и интерфейсы
          '**/constants.ts', // Константы (если не содержат логику)
          'vitest.setup.ts', // Bootstrap файлы
          'vitest.config*.ts', // Конфигурации
        ],
        thresholds: {
          statements: 80, // Рекомендуемый диапазон: 80-90%
          branches: 75, // Рекомендуемый диапазон: 70-85%
          functions: 80, // Рекомендуемый диапазон: 80-90%
          lines: 80, // Рекомендуемый диапазон: 80-90%
        },
      },
      name: { label: 'unit', color: 'green' },
      environment: 'jsdom',
      include: ['tests/unit/**/*.test.ts'],
      exclude: ['tests/integration/**/*'],
    },
  })
);
