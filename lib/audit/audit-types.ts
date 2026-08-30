import type { Country, ObjectType, PartyType } from '../common/domain-types';
import type { Perspective } from '../analysis';
import type { TaxGridResult } from '../analysis';

/**
 * A groundable audit dimension. Provide a value to fix (ground) it, an `{ options }` object to
 * narrow it to a set, or `null` to leave it open for the search to vary.
 */
export type Field<T> = T | { options: T[] } | null;

/** A tax grid and the amount the audit should target on it. */
export interface TargetGrid {
	grid: string;
	amount: number;
}

/**
 * Narrow or exclude a property across the audit search. `options` lists the argument tuples to
 * try, `samples` seeds specific argument values, and `exclude` drops the property entirely.
 */
export interface PropertyOverride {
	name: string;
	options?: unknown[][];
	samples?: Record<string, number[]>;
	exclude?: boolean;
}

/**
 * A supplier or receiver in an audit request. Each groundable dimension may be a fixed value, an
 * `{ options }` narrowing, `null`, or omitted entirely — omitting it leaves it open for the search.
 */
export interface AuditParty {
	type?: Field<PartyType>;
	vat_number: string;
	country?: Field<Country>;
	properties?: PropertyOverride[];
}

/**
 * The transacted object in an audit request. Each groundable dimension may be a fixed value, an
 * `{ options }` narrowing, `null`, or omitted entirely — omitting it leaves it open for the search.
 */
export interface AuditObject {
	type?: Field<ObjectType>;
	/** The place of supply, as a country equivalence class name (e.g. `belgium`, `other_eu`). */
	place?: Field<string>;
	properties?: PropertyOverride[];
}

/** A request to audit the input scenarios that produce a set of target grids. */
export interface AuditRequest {
	target: TargetGrid[];
	/** Date the taxable event occurs, as `YYYY-MM-DD`. */
	taxable_point: string;
	taxable_amount: number;
	vat_amount: number;
	supplier: AuditParty;
	receiver: AuditParty;
	object: AuditObject;
	perspective?: Perspective;
	/** Maximum number of scenarios to return. */
	limit?: number;
}

/** A numeric range an audit argument can take, from clp(fd) constraints. */
export interface NumericRange {
	min: unknown;
	max: unknown;
}

/** One argument of an audit property: a scalar value or a numeric range. */
export type AuditArg = string | number | boolean | null | NumericRange;

/** A property set on a party or object in an audit scenario. */
export interface AuditProperty {
	type: string;
	args: AuditArg[];
}

/** One scenario the audit found that produces the target grids. */
export interface AuditScenario {
	supplier_type: string;
	/** The supplier's country equivalence class. */
	supplier_country: string;
	receiver_type: string;
	/** The receiver's country equivalence class. */
	receiver_country: string;
	transaction_type: string;
	supplier_properties: AuditProperty[];
	customer_properties: AuditProperty[];
	object_properties: AuditProperty[];
	grids: TaxGridResult[];
}

/** The terminal line of an audit stream, describing how the search ended. */
export interface AuditTrailer {
	done: boolean;
	count: number;
	truncated: boolean;
	/** Why the search stopped, e.g. `complete`, `timeout`, or `limit`. */
	reason: string;
}

/** One dimension of the audit input model and how it can be grounded. */
export interface AuditDimension {
	field: string;
	label: string;
	mode: string;
	control: string;
	/** URL of the route that lists this dimension's values, when discovered remotely. */
	values_from?: string;
	/** Inline fixed set of values, when not discovered remotely. */
	values?: string[];
	/** URL of the country-class expansion route, for place-of-supply dimensions. */
	classes_from?: string;
	description?: string;
}

/** A descriptor of the audit input model: how to ground its dimensions. */
export interface AuditCapabilities {
	response_type: string;
	conventions: Record<string, string>;
	dimensions: AuditDimension[];
}
