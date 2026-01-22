/// <reference types="vitest/config" />
import { defineConfig, mergeConfig } from "vitest/config";
// @ts-ignore
import defaultConfig from "./vitest.config.default";

export default mergeConfig(
  defaultConfig,
  defineConfig({
    test: {
      reporters: [
        ["junit", { outputFile: ".test-results/unit-results.xml" }]
      ],
      coverage: {
        provider: "v8",
        reporter: ["lcov"],
        reportsDirectory: ".coverage/unit/",
        thresholds: {
          statements: 85,
          branches: 75,
          functions: 80,
          lines: 85,
        },
      },
      name: { label: "unit", color: "green" },
      environment: "jsdom",
      include: ["tests/unit/**/*.test.ts"],
      exclude: ["tests/integration/**/*"],
    },
  }),
);
