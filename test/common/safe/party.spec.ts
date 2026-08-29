import { describe, it, expect } from 'vitest';
import 'result-interface/vitest';
import { party, isSafeParty } from '../../../lib/common/safe/party';
import type { Party } from '../../../lib/analysis/tax-grid-input-types';
import { schema } from './fixtures';

const valid = (): Party => ({ type: 'company', country: 'belgium', properties: [] });

describe(party.name, () => {
	it('returns the validated party when valid', () => {
		const input = valid();
		expect(party(input, schema)).toBeResult(input);
	});
	it('returns the failures when a field is unknown', () => {
		expect(party({ ...valid(), country: 'atlantis' }, schema)).toBeError([
			{ path: 'country', message: 'must be a known country' }
		]);
	});
});

describe(isSafeParty.name, () => {
	it('narrows valid parties and rejects invalid ones', () => {
		expect(isSafeParty(valid(), schema)).toBe(true);
		expect(isSafeParty({ ...valid(), type: 'wizard' }, schema)).toBe(false);
	});
});
