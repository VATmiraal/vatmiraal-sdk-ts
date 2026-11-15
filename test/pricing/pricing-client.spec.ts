import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result, error, isError } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { ApiError } from '../../lib/client/api-error';
import {
	fetchPricing,
	fetchPricingContract,
	fetchPricingHeimdallDefinition
} from '../../lib/pricing/pricing-client';

const config = {
	version: '2026-11-12',
	currency: 'EUR',
	premium_multiplier: 2,
	below_commitment_penalty_rate: 0.1,
	below_commitment_minimum_price_ratio: 0.8,
	tiers: [{ from: 0, to: null, standard: 0.15 }]
};

function clientReturning(res: unknown): { client: Client; send: ReturnType<typeof vi.fn> } {
	const send = vi.fn().mockResolvedValue(res);
	return { client: { options: { token: 't' }, routes: [], request: send }, send };
}

describe(fetchPricing.name, () => {
	it('GETs /pricing and validates the config', async () => {
		const { client, send } = clientReturning(result(new Response(JSON.stringify(config))));
		expect(await fetchPricing(client)).toBeResult(config);
		expect(send).toHaveBeenCalledWith('/pricing', undefined);
	});
});

describe(fetchPricingContract.name, () => {
	it('GETs the contract bytes, defaulting the language', async () => {
		const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
		const { client, send } = clientReturning(result(new Response(pdf)));
		expect(await fetchPricingContract(client)).toBeResult(pdf);
		expect(send).toHaveBeenCalledWith('/pricing/contract', undefined);
	});

	it('passes the language as a query parameter', async () => {
		const { client, send } = clientReturning(result(new Response(new Uint8Array([1]))));
		await fetchPricingContract(client, 'fr');
		expect(send).toHaveBeenCalledWith('/pricing/contract?lang=fr', undefined);
	});

	it('propagates a transport error', async () => {
		const { client } = clientReturning(error(new Error('down')));
		expect(isError(await fetchPricingContract(client))).toBe(true);
	});

	it('surfaces a structured API error on a non-ok status', async () => {
		const body = JSON.stringify({ type: 'not_found', message: 'nope' });
		const { client } = clientReturning(result(new Response(body, { status: 404 })));
		const out = await fetchPricingContract(client);
		expect(isError(out)).toBe(true);
		if (isError(out)) {
			expect(out.error).toBeInstanceOf(ApiError);
			expect((out.error as ApiError).status).toBe(404);
		}
	});

	it('falls back to a generic error when the body is not an API error', async () => {
		const { client } = clientReturning(result(new Response('oops', { status: 500 })));
		expect(isError(await fetchPricingContract(client))).toBe(true);
	});

	it('errors when the body cannot be read as bytes', async () => {
		const broken = {
			ok: true,
			arrayBuffer: () => Promise.reject(new Error('boom'))
		} as unknown as Response;
		const { client } = clientReturning(result(broken));
		expect(isError(await fetchPricingContract(client))).toBe(true);
	});
});

describe(fetchPricingHeimdallDefinition.name, () => {
	it('GETs the definition bytes with the language', async () => {
		const { client, send } = clientReturning(result(new Response(new Uint8Array([1]))));
		await fetchPricingHeimdallDefinition(client, 'nl');
		expect(send).toHaveBeenCalledWith('/pricing/heimdall_definition?lang=nl', undefined);
	});
});
