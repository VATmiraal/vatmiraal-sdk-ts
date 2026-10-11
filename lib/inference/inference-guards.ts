import { isRecord, isStringArray } from '../common/guards';
import type { AnalysisProperty } from '../analysis/tax-grid-input-types';
import type { FieldMeta, Metadata } from '../common/metadata-types';
import type { Candidate, InferenceResult, RawProperty } from './inference-types';

function isFieldMeta(value: unknown): value is FieldMeta {
	return (
		isRecord(value) &&
		(value.confidence === 'high' || value.confidence === 'medium' || value.confidence === 'low') &&
		typeof value.comment === 'string'
	);
}

export function isMetadata(value: unknown): value is Metadata {
	return isRecord(value) && Object.values(value).every(isFieldMeta);
}

function isArgs(value: unknown): value is (string | number | boolean)[] {
	return (
		Array.isArray(value) &&
		value.every((v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
	);
}

function isAnalysisProperty(value: unknown): value is AnalysisProperty {
	return isRecord(value) && typeof value.type === 'string' && isArgs(value.args);
}

function isRawProperty(value: unknown): value is RawProperty {
	return (
		isRecord(value) &&
		typeof value.type === 'string' &&
		(value.args === undefined || isArgs(value.args))
	);
}

function isCandidate(value: unknown): value is Candidate {
	return (
		isRecord(value) &&
		(value.type === null || typeof value.type === 'string') &&
		isStringArray(value.transaction_types) &&
		Array.isArray(value.properties) &&
		value.properties.every(isAnalysisProperty) &&
		isStringArray(value.missing_properties) &&
		Array.isArray(value.extra) &&
		value.extra.every(isRawProperty) &&
		Array.isArray(value.invalid) &&
		value.invalid.every(isRawProperty) &&
		isMetadata(value.metadata)
	);
}

/** True when `value` is a well-formed {@link InferenceResult}. */
export function isInferenceResult(value: unknown): value is InferenceResult {
	return isRecord(value) && Array.isArray(value.candidates) && value.candidates.every(isCandidate);
}
