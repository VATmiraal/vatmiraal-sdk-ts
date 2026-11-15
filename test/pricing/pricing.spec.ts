import { describe, it, expect } from 'vitest';
import { isError, type Result } from 'result-interface';
import {
	validatePricing,
	pricePerVolume,
	graduatedTotal,
	priceWithCommitment,
	priceWithoutCommitment,
	type PricingConfig
} from '../../lib/pricing';

const config: PricingConfig = {
	version: '2026-11-12',
	currency: 'EUR',
	premium_multiplier: 2,
	below_commitment_penalty_rate: 0.1,
	below_commitment_minimum_price_ratio: 0.8,
	tiers: [
		{ from: 0, to: 25000, standard: 0.15 },
		{ from: 25000, to: 100000, standard: 0.12 },
		{ from: 100000, to: 500000, standard: 0.1 },
		{ from: 500000, to: 1000000, standard: 0.08 },
		{ from: 1000000, to: 3000000, standard: 0.065 },
		{ from: 3000000, to: null, standard: 0.05 }
	]
};

function value<T>(res: Result<T, Error>): T {
	if (isError(res)) throw res.error;
	return res.value;
}

describe(validatePricing.name, () => {
	it('accepts a well-formed config', () => {
		expect(isError(validatePricing(config))).toBe(false);
	});
	it('rejects each structural problem', () => {
		const bad = (over: Partial<PricingConfig>) => isError(validatePricing({ ...config, ...over }));
		expect(bad({ tiers: [] })).toBe(true);
		expect(bad({ tiers: [{ from: 10, to: null, standard: 0.1 }] })).toBe(true);
		expect(bad({ tiers: [{ from: 0, to: null, standard: 0 }] })).toBe(true);
		expect(bad({ tiers: [{ from: 0, to: 25000, standard: 0.15 }] })).toBe(true);
		expect(
			bad({
				tiers: [
					{ from: 0, to: 30000, standard: 0.15 },
					{ from: 25000, to: null, standard: 0.12 }
				]
			})
		).toBe(true);
		expect(
			bad({
				tiers: [
					{ from: 0, to: 0, standard: 0.15 },
					{ from: 0, to: null, standard: 0.12 }
				]
			})
		).toBe(true);
		expect(bad({ premium_multiplier: 0.5 })).toBe(true);
		expect(bad({ below_commitment_penalty_rate: -0.1 })).toBe(true);
		expect(bad({ below_commitment_minimum_price_ratio: 1.5 })).toBe(true);
		expect(bad({ below_commitment_minimum_price_ratio: -0.1 })).toBe(true);
	});
});

describe(pricePerVolume.name, () => {
	it('returns the tier price for a volume', () => {
		expect(value(pricePerVolume(config, 0))).toBe(0.15);
		expect(value(pricePerVolume(config, 288000))).toBe(0.1);
	});
	it('errors for a volume within no tier and for an invalid config', () => {
		expect(isError(pricePerVolume(config, -1))).toBe(true);
		expect(isError(pricePerVolume({ ...config, tiers: [] }, 0))).toBe(true);
	});
});

describe(graduatedTotal.name, () => {
	it('sums each tier slice', () => {
		expect(value(graduatedTotal(config, 288000))).toBeCloseTo(31550, 6);
	});
	it('errors for an invalid config', () => {
		expect(isError(graduatedTotal({ ...config, tiers: [] }, 1))).toBe(true);
	});
});

describe(priceWithCommitment.name, () => {
	it('bills actual at the committed price above the commitment', () => {
		const r = value(
			priceWithCommitment(config, { committed: 288000, actual: 300000, premium_share: 0 })
		);
		expect(r.below_commitment).toBe(false);
		expect(r.standard_price).toBe(0.1);
		expect(r.premium_price).toBe(0.2);
		expect(r.full_commitment_cost).toBeCloseTo(28800, 6);
		expect(r.invoices_outside_commitment).toBe(12000);
		expect(r.total).toBeCloseTo(30000, 6);
		expect(r.per_invoice).toBeCloseTo(0.1, 6);
	});
	it('applies graduated + penalty within the band below the commitment', () => {
		const r = value(
			priceWithCommitment(config, { committed: 288000, actual: 200000, premium_share: 0 })
		);
		expect(r.below_commitment).toBe(true);
		expect(r.total).toBeCloseTo(25025, 6); // 22750 × 1.10, within [23040, 28800]
	});
	it('floors the below-commitment charge', () => {
		const r = value(
			priceWithCommitment(config, { committed: 288000, actual: 150000, premium_share: 0 })
		);
		expect(r.total).toBeCloseTo(23040, 6); // 17750 × 1.10 = 19525 < 0.8 × 28800
	});
	it('caps the below-commitment charge at the full commitment', () => {
		const r = value(
			priceWithCommitment(config, { committed: 288000, actual: 287000, premium_share: 0 })
		);
		expect(r.total).toBeCloseTo(28800, 6); // 31450 × 1.10 = 34595 > 28800
	});
	it('applies the premium multiplier and reports the surcharge', () => {
		const r = value(
			priceWithCommitment(config, { committed: 288000, actual: 300000, premium_share: 0.5 })
		);
		expect(r.total).toBeCloseTo(45000, 6);
		expect(r.premium_surcharge).toBeCloseTo(15000, 6);
		expect(r.full_commitment_cost).toBeCloseTo(43200, 6);
	});
	it('omits per_invoice when there is no use', () => {
		const r = value(
			priceWithCommitment(config, { committed: 288000, actual: 0, premium_share: 0 })
		);
		expect(r.per_invoice).toBeUndefined();
		expect(r.total).toBeCloseTo(23040, 6);
	});
	it('propagates errors for a bad volume or config', () => {
		expect(
			isError(priceWithCommitment(config, { committed: -1, actual: 0, premium_share: 0 }))
		).toBe(true);
		expect(
			isError(
				priceWithCommitment({ ...config, tiers: [] }, { committed: 0, actual: 0, premium_share: 0 })
			)
		).toBe(true);
	});
});

describe(priceWithoutCommitment.name, () => {
	it('breaks the use down per tier', () => {
		const r = value(priceWithoutCommitment(config, { actual: 288000, premium_share: 0 }));
		expect(r.total).toBeCloseTo(31550, 6);
		expect(r.rows).toHaveLength(3);
		expect(r.rows[0]).toEqual({ from: 0, to: 25000, invoices: 25000, price: 0.15, cost: 3750 });
		expect(r.per_invoice).toBeCloseTo(31550 / 288000, 9);
	});
	it('applies the premium share and reports the surcharge', () => {
		const base = 31550;
		const r = value(priceWithoutCommitment(config, { actual: 288000, premium_share: 0.5 }));
		expect(r.total).toBeCloseTo(base * 1.5, 6);
		expect(r.premium_surcharge).toBeCloseTo(base * 0.5, 6);
	});
	it('marks the open-ended top tier with a null upper bound', () => {
		const r = value(priceWithoutCommitment(config, { actual: 4000000, premium_share: 0 }));
		expect(r.rows.at(-1)?.to).toBeNull();
	});
	it('omits per_invoice for no use and errors for a bad config', () => {
		const r = value(priceWithoutCommitment(config, { actual: 0, premium_share: 0 }));
		expect(r.rows).toHaveLength(0);
		expect(r.per_invoice).toBeUndefined();
		expect(
			isError(priceWithoutCommitment({ ...config, tiers: [] }, { actual: 1, premium_share: 0 }))
		).toBe(true);
	});
});
