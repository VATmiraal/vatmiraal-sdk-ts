import { defineConfig } from 'vitest/config';

// End-to-end tests run against a live VATmiraal service (see test/e2e/README.md).
// They are kept separate from the unit suite: no coverage thresholds, and they
// auto-skip when the service is unreachable.
export default defineConfig({
	test: {
		environment: 'node',
		include: ['test/e2e/**/*.e2e.ts'],
		testTimeout: 30_000
	}
});
