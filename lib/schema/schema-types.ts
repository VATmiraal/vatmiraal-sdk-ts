import type { Country, PartyType, TransactionType, TransportBy } from '../common/domain-types';

/** The broad grouping an object category belongs to. */
export interface BroadCategoryRef {
	value: string;
	label: string;
}

/** An object category and the taxonomy around it: its broad grouping, the
 * transaction types it applies to, and the object properties it accepts. */
export interface ObjectCategory {
	value: string;
	label: string;
	broad_category: BroadCategoryRef;
	transaction_types: TransactionType[];
	description: string;
	properties: string[];
}

/**
 * One argument a property expects. `domain` is the kind of value it takes: `oneof` (choose
 * from `values`), `int` (bounded by `min`/`max`), `country`, `rate` (an integer from 0 to 100),
 * `atom` (free-form string), or `type_name` (a reusable named type, given by `type_name`).
 */
export interface PropertyArg {
	name: string;
	domain: string;
	/** The reusable named type, when `domain` is `type_name`. */
	type_name?: string;
	/** Allowed values, when `domain` is `oneof`. */
	values?: string[];
	/** Lower bound, when `domain` is `int`. */
	min?: number;
	/** Upper bound, when `domain` is `int`. */
	max?: number;
}

/** An available object or party property and the arguments it expects. */
export interface PropertySpec {
	value: string;
	label: string;
	args: PropertyArg[];
}

/** The full domain vocabulary, loaded once. */
export interface VatSchema {
	transactionTypes: TransactionType[];
	partyTypes: PartyType[];
	transportBy: TransportBy[];
	countries: Country[];
	categories: ObjectCategory[];
	objectProperties: PropertySpec[];
	partyProperties: PropertySpec[];
}
