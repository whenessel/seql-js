import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'SeqlJS',
      formats: ['es', 'umd'],
      fileName: (format) => format === 'es' ? 'seql-js.js' : 'seql-js.umd.cjs'
    },
    sourcemap: true,
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  },
  plugins: [
    dts({
      rollupTypes: true,
      insertTypesEntry: true
    })
  ]
});
