import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import readPackage from 'read-pkg';
import ts from 'rollup-plugin-ts';

const pkg = readPackage.sync();

export default [
  {
    input: 'src/cli.ts',
    output: {
      dir: 'dist',
      format: 'cjs',
      banner: '#!/usr/bin/env node',
    },
    plugins: [
      nodeResolve({
        resolveOnly: (module) => {
          return pkg?.dependencies?.[module] == null && pkg?.devDependencies?.[module] == null;
        },
      }),
      ts({ tsconfig: 'tsconfig.prod.json' }),
      terser(),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        format: 'cjs',
        file: 'dist/cjs/fast-maker.js',
        sourcemap: true,
      },
      {
        format: 'esm',
        file: 'dist/esm/fast-maker.js',
        sourcemap: true,
      },
    ],

    plugins: [
      nodeResolve({
        resolveOnly: (module) => {
          return pkg?.dependencies?.[module] == null && pkg?.devDependencies?.[module] == null;
        },
      }),
      ts({ tsconfig: 'tsconfig.prod.json' }),
      terser(),
    ],
  },
];
