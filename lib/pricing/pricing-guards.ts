import { isRecord } from '../common/guards';
import type { PricingConfig, PricingTier } from './pricing-types';

/** True when `value` is a well-formed {@link PricingTier}. */
export function isPricingTier(value: unknown): value is PricingTier {
	return (
		isRecord(value) &&
		typeof value.from === 'number' &&
		(value.to === null || typeof value.to === 'number') &&
		typeof value.standard === 'number'
	);
}

/** True when `value` is a well-formed {@link PricingConfig}. */
export function isPricingConfig(value: unknown): value is PricingConfig {
	return (
		isRecord(value) &&
		typeof value.version === 'string' &&
		typeof value.currency === 'string' &&
		typeof value.premium_multiplier === 'number' &&
		typeof value.below_commitment_penalty_rate === 'number' &&
		typeof value.below_commitment_minimum_price_ratio === 'number' &&
		Array.isArray(value.tiers) &&
		value.tiers.every(isPricingTier)
	);
}
