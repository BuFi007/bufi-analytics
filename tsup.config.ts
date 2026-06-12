import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'sim/index': 'src/sim/index.ts',
    'metrics/index': 'src/metrics/index.ts',
    'dune/index': 'src/dune/index.ts',
    'registry/index': 'src/registry/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
});
