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
        exclude: [
          '**/index.ts', // Re-export файлы
          '**/*.d.ts', // TypeScript type definitions
          '**/types/**', // Типы и интерфейсы
          '**/constants.ts', // Константы (если не содержат логику)
          'vitest.setup.ts', // Bootstrap файлы
          'vitest.config*.ts', // Конфигурации
        ],
        thresholds: {
          statements: 65, // Рекомендуемый диапазон: 60-75%
          branches: 60, // Рекомендуемый диапазон: 50-65%
          functions: 65, // Нет фиксированного порога для integration
          lines: 65, // Рекомендуемый диапазон: 60-75%
        },
      },
      name: { label: 'integration', color: 'cyan' },
      environment: 'jsdom',
      include: ['tests/integration/**/*.test.ts'],
      exclude: ['tests/unit/**/*'],
    },
  })
);
