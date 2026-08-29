import { describe, it, expect } from 'vitest';
import 'result-interface/vitest';
import { transaction, isSafeTransaction } from '../../../lib/common/safe/transaction';
import { schema, validRequest } from './fixtures';

const valid = () => validRequest().transaction;

describe('transaction', () => {
	it('returns the validated transaction when valid', () => {
		const input = valid();
		expect(transaction(input, schema)).toBeResult(input);
	});
	it('reports the taxable point, amounts and type failures', () => {
		const input = {
			...valid(),
			taxable_point: '01/01/2026',
			type: 'barter',
			taxable_amount: -1,
			vat_amount: -2
		};
		expect(transaction(input, schema)).toBeError([
			{ path: 'taxable_point', message: 'must be a date in YYYY-MM-DD format' },
			{ path: 'type', message: 'must be a known transaction type' },
			{ path: 'taxable_amount', message: 'must be a number >= 0' },
			{ path: 'vat_amount', message: 'must be a number >= 0' }
		]);
	});
});

describe('isSafeTransaction', () => {
	it('narrows valid transactions and rejects invalid ones', () => {
		expect(isSafeTransaction(valid(), schema)).toBe(true);
		expect(isSafeTransaction({ ...valid(), taxable_amount: -1 }, schema)).toBe(false);
	});
});
