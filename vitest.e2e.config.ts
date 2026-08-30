import { defineConfig } from 'vitest/config';

// e2e tests run against a live backend (see scripts/e2e.ts). Separate from the unit config so the
// normal `test` run and its coverage gate never pick these up.
export default defineConfig({
	test: {
		environment: 'node',
		include: ['test/e2e/**/*.e2e.ts'],
		testTimeout: 120_000,
		hookTimeout: 120_000
	}
});
