import { describe, it, expect } from 'vitest';
import 'result-interface/vitest';
import {
	taxGridAnalysisRequest,
	isSafeTaxGridAnalysisRequest,
	validateTaxGridAnalysisRequest
} from '../../../lib/common/safe/request';
import type { ValidationError } from '../../../lib/common/safe/errors';
import { schema, validRequest } from './fixtures';

describe(taxGridAnalysisRequest.name, () => {
	it('returns the validated request when valid', () => {
		const input = validRequest();
		expect(taxGridAnalysisRequest(input, schema)).toBeResult(input);
	});

	it('reports nested failures with a dotted path and checks the perspective', () => {
		const input = validRequest();
		input.transaction.supplier.country = 'atlantis';
		input.perspective = 'auditor' as typeof input.perspective;

		expect(taxGridAnalysisRequest(input, schema)).toBeError([
			{ path: 'transaction.supplier.country', message: 'must be a known country' },
			{ path: 'perspective', message: "must be 'supplier' or 'receiver'" }
		]);
	});
});

describe(validateTaxGridAnalysisRequest.name, () => {
	it('prefixes failures with the given path when nested', () => {
		const input = validRequest();
		input.perspective = 'auditor' as typeof input.perspective;
		const errors: ValidationError[] = [];

		validateTaxGridAnalysisRequest(input, schema, 'request', errors);

		expect(errors).toContainEqual({
			path: 'request.perspective',
			message: "must be 'supplier' or 'receiver'"
		});
	});
});

describe(isSafeTaxGridAnalysisRequest.name, () => {
	it('narrows valid requests and rejects invalid ones', () => {
		expect(isSafeTaxGridAnalysisRequest(validRequest(), schema)).toBe(true);
		const bad = validRequest();
		bad.perspective = 'auditor' as typeof bad.perspective;
		expect(isSafeTaxGridAnalysisRequest(bad, schema)).toBe(false);
	});
});
