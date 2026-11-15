import { result, error, isError, type Result } from 'result-interface';
import type {
	CommittedResult,
	GraduatedResult,
	GraduatedRow,
	PricingConfig,
	PricingInput
} from './pricing-types';

/**
 * Checks that a pricing config is well formed before it is used, so the tiers start at 0 and cover
 * a contiguous increasing range with positive prices and an in-range multiplier and reserve rate.
 * Returns the config when valid or an error describing the first problem found.
 */
export function validatePricing(config: PricingConfig): Result<PricingConfig, Error> {
	const tiers = config.tiers;
	if (tiers.length === 0) {
		return error(new Error('pricing has no tiers'));
	}
	for (const [i, tier] of tiers.entries()) {
		if (i === 0 && tier.from !== 0) {
			return error(new Error('first tier must start at 0'));
		}
		if (tier.standard <= 0) {
			return error(new Error(`tier ${i} has a non-positive price`));
		}
		const next = tiers[i + 1];
		if (next === undefined) {
			if (tier.to !== null) {
				return error(new Error('last tier must be open-ended'));
			}
		} else if (tier.to !== next.from) {
			return error(new Error(`tier ${i} must be contiguous with the next tier`));
		} else if (next.from <= tier.from) {
			return error(new Error('tiers must be in increasing order'));
		}
	}
	if (config.premium_multiplier < 1) {
		return error(new Error('premium multiplier must be at least 1'));
	}
	if (config.below_commitment_penalty_rate < 0) {
		return error(new Error('below-commitment penalty rate must be at least 0'));
	}
	if (
		config.below_commitment_minimum_price_ratio < 0 ||
		config.below_commitment_minimum_price_ratio > 1
	) {
		return error(new Error('below-commitment minimum price ratio must be between 0 and 1'));
	}
	return result(config);
}

/**
 * The standard per-invoice price for a cumulative annual volume, taken from the highest tier the
 * volume reaches. The price stays flat within a tier and errors when the volume is not within any tier.
 */
export function pricePerVolume(config: PricingConfig, volume: number): Result<number, Error> {
	const respValidatedConfig = validatePricing(config);
	if (isError(respValidatedConfig)) {
		return respValidatedConfig;
	}
	let price: number | undefined;
	for (const tier of config.tiers) {
		if (volume >= tier.from) {
			price = tier.standard;
		}
	}
	if (price === undefined) {
		return error(new Error(`volume ${volume} is not within any tier`));
	}
	return result(price);
}

/**
 * The total cost with no commitment, billing each invoice at the price of the tier its cumulative
 * position falls in.
 */
export function graduatedTotal(config: PricingConfig, volume: number): Result<number, Error> {
	const respValidatedConfig = validatePricing(config);
	if (isError(respValidatedConfig)) {
		return respValidatedConfig;
	}
	let cost = 0;
	for (const tier of config.tiers) {
		const upperBound = tier.to ?? Infinity;
		cost += Math.max(0, Math.min(volume, upperBound) - tier.from) * tier.standard;
	}
	return result(cost);
}

/**
 * Track B pricing with no commitment: every invoice billed at the price of the tier its cumulative
 * position falls in, reported per tier and in total.
 */
export function priceWithoutCommitment(
	config: PricingConfig,
	input: { actual: number; premium_share: number }
): Result<GraduatedResult, Error> {
	const respValidatedConfig = validatePricing(config);
	if (isError(respValidatedConfig)) {
		return respValidatedConfig;
	}
	const { actual, premium_share } = input;
	const multiplier = 1 + premium_share;

	let base = 0;
	const rows: GraduatedRow[] = [];
	for (const tier of config.tiers) {
		const upperBound = tier.to ?? Infinity;
		const invoices = Math.max(0, Math.min(actual, upperBound) - tier.from);
		if (invoices <= 0) {
			continue;
		}
		const cost = invoices * tier.standard;
		base += cost;
		rows.push({ from: tier.from, to: tier.to, invoices, price: tier.standard, cost });
	}

	const total = base * multiplier;
	return result({
		mode: 'graduated',
		rows,
		premium_surcharge: premium_share > 0 ? total - total / multiplier : 0,
		total,
		volume: actual,
		per_invoice: actual ? total / actual : undefined
	});
}

/**
 * Track A pricing. At or above the commitment every invoice is at the committed price. Below it the
 * charge is the graduated cost plus the below-commitment penalty, floored at a ratio of the committed
 * amount and capped at the full committed amount.
 */
export function priceWithCommitment(
	config: PricingConfig,
	input: PricingInput
): Result<CommittedResult, Error> {
	const respValidatedConfig = validatePricing(config);
	if (isError(respValidatedConfig)) {
		return respValidatedConfig;
	}
	const { committed, actual, premium_share } = input;
	const multiplier = 1 + premium_share;

	const respCommittedPrice = pricePerVolume(config, committed);
	if (isError(respCommittedPrice)) {
		return respCommittedPrice;
	}
	const committedPrice = respCommittedPrice.value;
	const committedAmount = committed * committedPrice * multiplier;
	const below_commitment = actual < committed;

	let total: number;
	if (below_commitment) {
		const respGraduated = graduatedTotal(config, actual);
		// Unreachable: the config was validated above.
		/* v8 ignore start */
		if (isError(respGraduated)) {
			return respGraduated;
		}
		/* v8 ignore stop */
		const penalised = respGraduated.value * multiplier * (1 + config.below_commitment_penalty_rate);
		const floor = config.below_commitment_minimum_price_ratio * committedAmount;
		total = Math.min(committedAmount, Math.max(floor, penalised));
	} else {
		total = actual * committedPrice * multiplier;
	}

	return result({
		mode: 'committed',
		standard_price: committedPrice,
		premium_price: committedPrice * config.premium_multiplier,
		below_commitment,
		invoices_outside_commitment: actual - committed,
		full_commitment_cost: committedAmount,
		premium_surcharge: premium_share > 0 ? total - total / multiplier : 0,
		total,
		per_invoice: actual ? total / actual : undefined
	});
}
