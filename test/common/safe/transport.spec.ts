import { describe, it, expect } from 'vitest';
import 'result-interface/vitest';
import { transport, isSafeTransport } from '../../../lib/common/safe/transport';
import type { Transport } from '../../../lib/analysis/tax-grid-input-types';
import { schema } from './fixtures';

const valid = (): Transport => ({
	from: 'belgium',
	to: 'france',
	by: 'transport_by_seller',
	proof_of_transport: true
});

describe(transport.name, () => {
	it('returns the validated transport when every field is known', () => {
		const input = valid();
		expect(transport(input, schema)).toBeResult(input);
	});
	it('returns the failures when a field is unknown', () => {
		expect(transport({ ...valid(), from: 'atlantis' }, schema)).toBeError([
			{ path: 'from', message: 'must be a known country' }
		]);
	});
});

describe(isSafeTransport.name, () => {
	it('narrows valid transports and rejects invalid ones', () => {
		expect(isSafeTransport(valid(), schema)).toBe(true);
		expect(isSafeTransport({ ...valid(), by: 'carrier_pigeon' }, schema)).toBe(false);
	});
});
