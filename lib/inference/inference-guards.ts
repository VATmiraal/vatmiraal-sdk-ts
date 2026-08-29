import type { AnalysisProperty } from '../analysis/tax-grid-input-types';
import type { Candidate, InferenceResult, RawProperty } from './inference-types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((v) => typeof v === 'string');
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
		typeof value.type === 'string' &&
		isStringArray(value.transaction_types) &&
		Array.isArray(value.properties) &&
		value.properties.every(isAnalysisProperty) &&
		isStringArray(value.missing_properties) &&
		Array.isArray(value.extra) &&
		value.extra.every(isRawProperty) &&
		Array.isArray(value.invalid) &&
		value.invalid.every(isRawProperty) &&
		typeof value.comment === 'string'
	);
}

/** True when `value` is a well-formed {@link InferenceResult}. */
export function isInferenceResult(value: unknown): value is InferenceResult {
	return isRecord(value) && Array.isArray(value.candidates) && value.candidates.every(isCandidate);
}
