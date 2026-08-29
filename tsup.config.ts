import { defineConfig } from 'tsup';

export default defineConfig([
	{
		// npm build: readable ESM + CJS + type declarations.
		entry: ['index.ts'],
		format: ['esm', 'cjs'],
		dts: true,
		sourcemap: true,
		clean: true,
		target: 'es2022',
		outDir: 'dist'
	},
	{
		// browser/CDN build: a single minified global bundle.
		entry: { 'vatmiraal-sdk': 'index.ts' },
		format: ['iife'],
		globalName: 'Vatmiraal',
		minify: true,
		sourcemap: true,
		target: 'es2022',
		outDir: 'dist/browser'
	}
]);
