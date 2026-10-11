import { $ } from 'bun';

// Run the e2e suite against a backend you already have running locally. Override the URL with
// VATMIRAAL_E2E_URL. The suite authenticates with the backend's dev token.
const baseUrl = process.env.VATMIRAAL_E2E_URL ?? 'http://localhost:8468';

async function isHealthy(): Promise<boolean> {
	try {
		const res = await fetch(`${baseUrl}/`);
		return res.ok && ((await res.json()) as { alive?: boolean }).alive === true;
	} catch {
		return false;
	}
}

if (!(await isHealthy())) {
	console.error(
		`No VATmiraal backend reachable at ${baseUrl}.\n` +
			`Start one locally, then re-run. Override the URL with VATMIRAAL_E2E_URL.`
	);
	process.exit(1);
}

await $`bunx vitest run --config vitest.e2e.config.ts`;
