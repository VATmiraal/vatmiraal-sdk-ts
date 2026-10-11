/** Certainty of a field's reading. */
export type Confidence = 'high' | 'medium' | 'low';

/** One field's extraction confidence and the reasoning behind how it was read. */
export interface FieldMeta {
	/** Certainty of the reading. */
	confidence: Confidence;
	/** Why the field was read this way. */
	comment: string;
}

/** Per-field confidence and reasoning, keyed by field name. */
export type Metadata = Record<string, FieldMeta>;
