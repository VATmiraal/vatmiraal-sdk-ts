import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['test/**/*.spec.ts'],
		coverage: {
			provider: 'v8',
			include: ['lib/**'],
			exclude: ['lib/generated/**'],
			thresholds: {
				statements: 100,
				branches: 100,
				functions: 100,
				lines: 100
			}
		}
	}
});
