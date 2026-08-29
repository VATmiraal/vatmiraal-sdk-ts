import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import type { TaxGridAnalysisRequest } from '../../lib/analysis/tax-grid-input-types';
import { analyzeTaxGrid } from '../../lib/analysis/analyze';

const request: TaxGridAnalysisRequest = {
	transaction: {
		taxable_point: '2026-01-01',
		type: 'service',
		taxable_amount: 100,
		vat_amount: 21,
		supplier: { type: 'company', country: 'belgium', properties: [] },
		receiver: { type: 'company', country: 'belgium', properties: [] },
		object: { type: 'general_service', properties: [] }
	},
	perspective: 'supplier'
};

describe(analyzeTaxGrid.name, () => {
	it('POSTs the request to /tax-grid-analysis and parses the response', async () => {
		const response = { status: 'consistent', grids: [], warnings: [] };
		const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(response))));
		const client: Client = { options: { token: 't' }, request: send };

		expect(await analyzeTaxGrid(client, request)).toBeResult(response);
		expect(send).toHaveBeenCalledWith(
			'/tax-grid-analysis',
			expect.objectContaining({ method: 'POST', body: JSON.stringify(request) })
		);
	});
});
