import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import {
	computeCarDeductability,
	fetchCarDeductabilityMethods,
	fetchCarDeductabilitySchema,
	fetchCarDeductabilitySchemasByMethod,
	fetchCarDeductabilitySchemasByType,
	fetchCarDeductabilityTypes
} from '../../lib/car-deductability/car-deductability';

const SCHEMA = { type: 'car', method: 'flat_rate', args: [] };
const RESULTS = [{ not_applicable: false, percentage: 35, legal_reference: { code: 'c' } }];

function clientReturning(body: unknown) {
	const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(body))));
	const client: Client = { options: { token: 't' }, routes: [], request: send };
	return { client, send };
}

describe(fetchCarDeductabilityMethods.name, () => {
	it('GETs the methods list', async () => {
		const values = [{ value: 'flat_rate' }];
		const { client, send } = clientReturning(values);
		expect(await fetchCarDeductabilityMethods(client)).toBeResult(values);
		expect(send).toHaveBeenCalledWith('/deductability/car/schema/method', undefined);
	});
});

describe(fetchCarDeductabilitySchemasByMethod.name, () => {
	it('GETs the schemas keyed by type for a method', async () => {
		const map = { car: SCHEMA };
		const { client, send } = clientReturning(map);
		expect(await fetchCarDeductabilitySchemasByMethod(client, 'flat_rate')).toBeResult(map);
		expect(send).toHaveBeenCalledWith('/deductability/car/schema/method/flat_rate', undefined);
	});
});

describe(fetchCarDeductabilityTypes.name, () => {
	it('GETs the types list', async () => {
		const values = [{ value: 'car' }];
		const { client, send } = clientReturning(values);
		expect(await fetchCarDeductabilityTypes(client)).toBeResult(values);
		expect(send).toHaveBeenCalledWith('/deductability/car/schema/type', undefined);
	});
});

describe(fetchCarDeductabilitySchemasByType.name, () => {
	it('GETs the schemas keyed by method for a type', async () => {
		const map = { flat_rate: SCHEMA };
		const { client, send } = clientReturning(map);
		expect(await fetchCarDeductabilitySchemasByType(client, 'car')).toBeResult(map);
		expect(send).toHaveBeenCalledWith('/deductability/car/schema/type/car', undefined);
	});
});

describe(fetchCarDeductabilitySchema.name, () => {
	it('GETs a single schema by type and method', async () => {
		const { client, send } = clientReturning(SCHEMA);
		expect(await fetchCarDeductabilitySchema(client, 'car', 'flat_rate')).toBeResult(SCHEMA);
		expect(send).toHaveBeenCalledWith('/deductability/car/schema/car/flat_rate', undefined);
	});
});

describe(computeCarDeductability.name, () => {
	it('POSTs the request as JSON and parses the results', async () => {
		const { client, send } = clientReturning(RESULTS);
		const input = { type: 'car', method: 'flat_rate', args: {} };
		expect(await computeCarDeductability(client, input)).toBeResult(RESULTS);
		const [path, init] = send.mock.calls[0]!;
		expect(path).toBe('/deductability/car');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body as string)).toEqual(input);
	});

	it('errors when the payload is not a deductability result array', async () => {
		const { client } = clientReturning({ nope: true });
		expect(
			await computeCarDeductability(client, { type: 'car', method: 'flat_rate', args: {} })
		).toBeError();
	});
});
