import { describe, it, expect } from 'vitest';
import 'result-interface/vitest';
import { analysisObject, isSafeAnalysisObject } from '../../../lib/common/safe/analysis-object';
import type { AnalysisObject } from '../../../lib/analysis/tax-grid-input-types';
import { schema } from './fixtures';

const valid = (): AnalysisObject => ({
	type: 'general_service',
	properties: []
});

describe('analysisObject', () => {
	it('returns the validated object when valid', () => {
		const input = valid();
		expect(analysisObject(input, schema)).toBeResult(input);
	});
	it('validates the transport when present', () => {
		const input: AnalysisObject = {
			...valid(),
			transport: {
				from: 'atlantis',
				to: 'france',
				by: 'transport_by_seller',
				proof_of_transport: true
			}
		};
		expect(analysisObject(input, schema)).toBeError([
			{ path: 'transport.from', message: 'must be a known country' }
		]);
	});
	it('returns the failures when the type is unknown', () => {
		expect(analysisObject({ ...valid(), type: 'spaceship' }, schema)).toBeError([
			{ path: 'type', message: 'must be a known object type' }
		]);
	});
});

describe('isSafeAnalysisObject', () => {
	it('narrows valid objects and rejects invalid ones', () => {
		expect(isSafeAnalysisObject(valid(), schema)).toBe(true);
		expect(isSafeAnalysisObject({ ...valid(), type: 'spaceship' }, schema)).toBe(false);
	});
});
