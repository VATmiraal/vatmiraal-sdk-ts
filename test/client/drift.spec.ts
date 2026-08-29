import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { checkEndpointDrift } from '../../lib/client/drift';

function clientReturning(doc: unknown): Client {
	const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(doc))));
	return { options: { token: 't' }, request: send };
}

// A spec that declares every endpoint the SDK calls.
const fullPaths: Record<string, Record<string, unknown>> = {
	'/': { get: {} },
	'/tax-grid-analysis': { post: {} },
	'/vat-validation': { post: {} },
	'/vat-template': { get: {} },
	'/vat-template/{country}': { get: {} },
	'/inference/object': { post: {} },
	'/transaction-type': { get: {} },
	'/party-type': { get: {} },
	'/transport-by': { get: {} },
	'/country': { get: {} },
	'/category': { get: {} },
	'/property/object': { get: {} },
	'/property/party': { get: {} }
};

describe(checkEndpointDrift.name, () => {
	it('reports ok when every endpoint is present', async () => {
		expect(await checkEndpointDrift(clientReturning({ paths: fullPaths }))).toBeResult({
			ok: true,
			missing: []
		});
	});

	it('reports a missing path', async () => {
		const paths = { ...fullPaths };
		delete paths['/country'];
		expect(await checkEndpointDrift(clientReturning({ paths }))).toBeResult({
			ok: false,
			missing: [{ method: 'GET', path: '/country' }]
		});
	});

	it('reports a path present but missing the expected method', async () => {
		const paths = { ...fullPaths, '/tax-grid-analysis': { get: {} } };
		expect(await checkEndpointDrift(clientReturning({ paths }))).toBeResult({
			ok: false,
			missing: [{ method: 'POST', path: '/tax-grid-analysis' }]
		});
	});

	it('propagates a fetch error', async () => {
		const send = vi.fn().mockResolvedValue(result(new Response('', { status: 500 })));
		const client: Client = { options: { token: 't' }, request: send };
		expect(await checkEndpointDrift(client)).toBeError();
	});
});
