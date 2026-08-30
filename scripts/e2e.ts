import { $ } from 'bun';

// Bring up the local backend stack (Ollama + the backend built from its git repo), wait for it to
// be healthy, run the e2e suite against it, then tear everything down. Local-only; needs podman and
// a git-authenticated host for the private backend clone. See test/e2e/compose.yml.
const compose = ['compose', '-f', 'test/e2e/compose.yml'];
const baseUrl = process.env.VATMIRAAL_E2E_URL ?? 'http://localhost:8080';

async function waitHealthy(timeoutMs = 180_000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(`${baseUrl}/`);
			if (res.ok && ((await res.json()) as { alive?: boolean }).alive) {
				return;
			}
		} catch {
			// backend not accepting connections yet
		}
		await Bun.sleep(2000);
	}
	throw new Error(`backend at ${baseUrl} did not become healthy in time`);
}

try {
	await $`podman ${compose} up -d --build`;
	console.log('==> waiting for the backend to become healthy...');
	await waitHealthy();
	await $`bunx vitest run --config vitest.e2e.config.ts`;
} finally {
	await $`podman ${compose} down -v`;
}
