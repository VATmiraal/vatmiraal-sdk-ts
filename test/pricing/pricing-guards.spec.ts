import { describe, it, expect } from 'vitest';
import { isPricingTier, isPricingConfig } from '../../lib/pricing/pricing-guards';

const tier = { from: 0, to: 25000, standard: 0.15 };

const config = {
	version: '2026-11-12',
	currency: 'EUR',
	premium_multiplier: 2,
	below_commitment_penalty_rate: 0.1,
	below_commitment_minimum_price_ratio: 0.8,
	tiers: [tier, { from: 25000, to: null, standard: 0.12 }]
};

describe(isPricingTier.name, () => {
	it('accepts a numeric or null upper bound', () => {
		expect(isPricingTier(tier)).toBe(true);
		expect(isPricingTier({ from: 0, to: null, standard: 0.1 })).toBe(true);
	});
	it('rejects non-records and each malformed field', () => {
		expect(isPricingTier(null)).toBe(false);
		expect(isPricingTier({ ...tier, from: '0' })).toBe(false);
		expect(isPricingTier({ ...tier, to: 'x' })).toBe(false);
		expect(isPricingTier({ ...tier, standard: '0.15' })).toBe(false);
	});
});

describe(isPricingConfig.name, () => {
	it('accepts a well-formed config', () => {
		expect(isPricingConfig(config)).toBe(true);
	});
	it('rejects non-records and each malformed field', () => {
		expect(isPricingConfig(null)).toBe(false);
		expect(isPricingConfig({ ...config, version: 1 })).toBe(false);
		expect(isPricingConfig({ ...config, currency: 1 })).toBe(false);
		expect(isPricingConfig({ ...config, premium_multiplier: '2' })).toBe(false);
		expect(isPricingConfig({ ...config, below_commitment_penalty_rate: '0.1' })).toBe(false);
		expect(isPricingConfig({ ...config, below_commitment_minimum_price_ratio: '0.8' })).toBe(false);
		expect(isPricingConfig({ ...config, tiers: 'nope' })).toBe(false);
		expect(isPricingConfig({ ...config, tiers: [{ from: 0 }] })).toBe(false);
	});
});
