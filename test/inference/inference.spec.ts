import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { inferObject } from '../../lib/inference/inference';

describe(inferObject.name, () => {
	it('POSTs the description to /inference/object and parses the candidates', async () => {
		const out = { candidates: [] };
		const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(out))));
		const client: Client = { options: { token: 't' }, routes: [], request: send };

		expect(await inferObject(client, 'consulting services')).toBeResult(out);
		expect(send).toHaveBeenCalledWith(
			'/inference/object',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ description: 'consulting services' })
			})
		);
	});
});
