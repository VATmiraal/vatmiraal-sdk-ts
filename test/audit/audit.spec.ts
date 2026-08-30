import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result, isError } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { auditScenarios, fetchAuditCapabilities } from '../../lib/audit/audit';
import type { AuditRequest, AuditScenario, AuditTrailer } from '../../lib/audit/audit-types';

const request: AuditRequest = {
	target: [{ grid: '55', amount: 21 }],
	taxable_point: '2026-01-01',
	taxable_amount: 100,
	vat_amount: 21,
	supplier: { type: null, vat_number: '', country: 'belgium' },
	receiver: { type: { options: ['company'] }, vat_number: '', country: null },
	object: { type: 'general_service', place: null },
	perspective: 'supplier',
	limit: 10
};

const scenario = {
	supplier_type: 'company',
	supplier_country: 'belgium',
	receiver_type: 'company',
	receiver_country: 'other_eu',
	transaction_type: 'service',
	supplier_properties: [],
	customer_properties: [],
	object_properties: [],
	grids: [{ grid: '55', amount: 21, justifications: [] }]
};
const trailer = { done: true, count: 1, truncated: false, reason: 'complete' };

function ndjsonClient(lines: unknown[]): { client: Client; send: ReturnType<typeof vi.fn> } {
	const body = lines.map((line) => JSON.stringify(line)).join('\n') + '\n';
	const send = vi.fn().mockResolvedValue(result(new Response(body)));
	return { client: { options: { token: 't' }, request: send }, send };
}

async function drain(gen: AsyncGenerator<AuditScenario, AuditTrailer, void>): Promise<void> {
	const collected: AuditScenario[] = [];
	for await (const scene of gen) {
		collected.push(scene);
	}
}

describe(auditScenarios.name, () => {
	it('POSTs /audit, yields each scenario, and returns the trailer', async () => {
		const { client, send } = ndjsonClient([scenario, trailer]);

		const stream = await auditScenarios(client, request);
		expect(isError(stream)).toBe(false);
		if (isError(stream)) {
			return;
		}

		const scenarios: AuditScenario[] = [];
		let next = await stream.value.next();
		while (!next.done) {
			scenarios.push(next.value);
			next = await stream.value.next();
		}

		expect(scenarios).toEqual([scenario]);
		expect(next.value).toEqual(trailer);
		expect(send).toHaveBeenCalledWith(
			'/audit',
			expect.objectContaining({ method: 'POST', body: JSON.stringify(request) })
		);
	});

	it('resolves to an error when the setup fails (503 queue full)', async () => {
		const send = vi.fn().mockResolvedValue(result(new Response('busy', { status: 503 })));
		const client: Client = { options: { token: 't' }, request: send };

		expect(await auditScenarios(client, request)).toBeError(new Error('/audit returned 503'));
	});

	it('throws when the service reports an engine error mid-stream', async () => {
		const { client } = ndjsonClient([{ error: 'engine blew up' }]);
		const stream = await auditScenarios(client, request);
		if (isError(stream)) {
			throw stream.error;
		}
		await expect(drain(stream.value)).rejects.toThrow('engine blew up');
	});

	it('throws on an unexpected line', async () => {
		const { client } = ndjsonClient([{ nonsense: true }]);
		const stream = await auditScenarios(client, request);
		if (isError(stream)) {
			throw stream.error;
		}
		await expect(drain(stream.value)).rejects.toThrow('unexpected line');
	});

	it('throws when the stream ends without a trailer', async () => {
		const { client } = ndjsonClient([scenario]);
		const stream = await auditScenarios(client, request);
		if (isError(stream)) {
			throw stream.error;
		}
		await expect(drain(stream.value)).rejects.toThrow('without a trailer');
	});
});

describe(fetchAuditCapabilities.name, () => {
	it('GETs /audit/capabilities', async () => {
		const caps = {
			response_type: 'application/x-ndjson',
			conventions: { ground: 'scalar' },
			dimensions: []
		};
		const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(caps))));
		const client: Client = { options: { token: 't' }, request: send };

		expect(await fetchAuditCapabilities(client)).toBeResult(caps);
		expect(send).toHaveBeenCalledWith('/audit/capabilities', undefined);
	});
});
