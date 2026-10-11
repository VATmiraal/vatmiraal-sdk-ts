import type { AnalysisProperty } from '../analysis/tax-grid-input-types';
import type { ObjectType, TransactionType } from '../common/domain-types';
import type { Metadata } from '../common/metadata-types';

/** A free-text description to infer a structured object from. */
export interface InferenceRequest {
	/** Free-text description of the object, e.g. `'consulting services'`. */
	description: string;
}

/** A property mentioned in a description whose name or arguments are not recognised. */
export interface RawProperty {
	type: string;
	args?: (string | number | boolean)[];
}

/** A candidate object type inferred from a description. */
export interface Candidate {
	/** The inferred object type, or `null` when classification fails. */
	type: ObjectType | null;
	/** Transaction types the inferred type is compatible with. */
	transaction_types: TransactionType[];
	/** Recognised properties found in the description. */
	properties: AnalysisProperty[];
	/** Required properties of the type not stated in the description. */
	missing_properties: string[];
	/** Attributes found that are not known properties of the type. */
	extra: RawProperty[];
	/** Known properties whose argument is outside the accepted domain. */
	invalid: RawProperty[];
	/** Per-field confidence and reasoning, keyed by field name. */
	metadata: Metadata;
}

/** The inferred object candidates for a description, most likely first. */
export interface InferenceResult {
	candidates: Candidate[];
}
