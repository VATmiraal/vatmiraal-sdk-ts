import type { Currency } from '../common/domain-types';

/** One rate tier: invoices in the cumulative-volume range `[from, to)` cost `standard` each. */
export interface PricingTier {
	/** Inclusive lower bound of cumulative volume for this tier. */
	from: number;
	/** Exclusive upper bound; null for the open-ended top tier. */
	to: number | null;
	/** Standard price per invoice in this tier. */
	standard: number;
}

/** The pricing model served by the VATmiraal API. */
export interface PricingConfig {
	/** Version date of this config, `YYYY-MM-DD`. */
	version: string;
	/** ISO 4217 currency code. */
	currency: Currency;
	/** A premium invoice costs `standard × premium_multiplier`. */
	premium_multiplier: number;
	/** Penalty added to the graduated cost below the commitment (clause 3.3), e.g. 0.10 for +10%. */
	below_commitment_penalty_rate: number;
	/** Floor on the below-commitment charge as a fraction of the committed amount, e.g. 0.80; the cap is always the full committed amount. */
	below_commitment_minimum_price_ratio: number;
	/** Tiers in ascending order of `from`. */
	tiers: PricingTier[];
}

/** Calculator inputs. `premium_share` is a fraction in [0, 1]. */
export interface PricingInput {
	committed: number;
	actual: number;
	premium_share: number;
}

/** Committed-mode result. `below_commitment` selects which fields the UI shows. */
export interface CommittedResult {
	mode: 'committed';
	standard_price: number;
	premium_price: number;
	below_commitment: boolean;
	/** Signed actual minus committed: positive is invoices above the commitment, negative is below. */
	invoices_outside_commitment: number;
	/** The committed amount (committed volume × committed price); the 100% cap below the commitment. */
	full_commitment_cost: number;
	premium_surcharge: number;
	total: number;
	/** Cost per invoice used; omitted when there is no use. */
	per_invoice?: number;
}

/** One graduated tier row that carries invoices. */
export interface GraduatedRow {
	from: number;
	/** Exclusive upper bound; null for the open-ended top tier. */
	to: number | null;
	/** Number of invoices that fall in this tier's range. */
	invoices: number;
	/** Standard price per invoice in this tier. */
	price: number;
	/** Cost contributed by this tier: `invoices × price`. */
	cost: number;
}

/** Graduated-mode result. */
export interface GraduatedResult {
	mode: 'graduated';
	rows: GraduatedRow[];
	premium_surcharge: number;
	total: number;
	volume: number;
	/** Cost per invoice used; omitted when there is no use. */
	per_invoice?: number;
}
