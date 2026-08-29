import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import {
	validateVat,
	fetchVatTemplates,
	fetchVatTemplate
} from '../../lib/vat-validation/vat-validation';

function clientReturning(body: unknown): { client: Client; send: ReturnType<typeof vi.fn> } {
	const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(body))));
	return { client: { options: { token: 't' }, request: send }, send };
}

describe('validateVat', () => {
	it('POSTs the input to /vat-validation', async () => {
		const out = { valid: false, invalid_context: ['bad'] };
		const { client, send } = clientReturning(out);

		expect(await validateVat(client, { vat: 'BE0123', template_validation: true })).toBeResult(out);
		expect(send).toHaveBeenCalledWith(
			'/vat-validation',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ vat: 'BE0123', template_validation: true })
			})
		);
	});
});

describe('fetchVatTemplates', () => {
	it('GETs /vat-template', async () => {
		const templates = [{ country: 'belgium', country_code: 'BE', template: 'BE0999999999' }];
		const { client, send } = clientReturning(templates);

		expect(await fetchVatTemplates(client)).toBeResult(templates);
		expect(send).toHaveBeenCalledWith('/vat-template', undefined);
	});
});

describe('fetchVatTemplate', () => {
	it('GETs /vat-template/{country}, url-encoding the country', async () => {
		const template = { country: 'belgium', country_code: 'BE', template: 'BE0999999999' };
		const { client, send } = clientReturning(template);

		expect(await fetchVatTemplate(client, 'belgium')).toBeResult(template);
		expect(send).toHaveBeenCalledWith('/vat-template/belgium', undefined);
	});
});
