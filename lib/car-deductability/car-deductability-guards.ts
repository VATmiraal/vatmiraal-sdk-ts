import { isRecord } from '../common/guards';
import { isLegalReference } from '../analysis';
import type {
	CarDeductabilityArg,
	CarDeductabilitySchema,
	CarDeductabilityValue,
	DeductabilityResult
} from './car-deductability-types';

function isNumberOrNull(value: unknown): value is number | null {
	return value === null || typeof value === 'number';
}

export function isCarDeductabilityArg(value: unknown): value is CarDeductabilityArg {
	return (
		isRecord(value) &&
		typeof value.name === 'string' &&
		isNumberOrNull(value.lower_bound) &&
		isNumberOrNull(value.upper_bound)
	);
}

export function isCarDeductabilitySchema(value: unknown): value is CarDeductabilitySchema {
	return (
		isRecord(value) &&
		typeof value.type === 'string' &&
		typeof value.method === 'string' &&
		Array.isArray(value.args) &&
		value.args.every(isCarDeductabilityArg)
	);
}

export function isCarDeductabilityValueArray(value: unknown): value is CarDeductabilityValue[] {
	return Array.isArray(value) && value.every((v) => isRecord(v) && typeof v.value === 'string');
}

export function isCarDeductabilitySchemaMap(
	value: unknown
): value is Record<string, CarDeductabilitySchema> {
	return isRecord(value) && Object.values(value).every(isCarDeductabilitySchema);
}

export function isDeductabilityResult(value: unknown): value is DeductabilityResult {
	if (!isRecord(value)) {
		return false;
	}
	if (value.not_applicable === true) {
		return true;
	}
	return (
		value.not_applicable === false &&
		typeof value.percentage === 'number' &&
		isLegalReference(value.legal_reference)
	);
}

export function isDeductabilityResultArray(value: unknown): value is DeductabilityResult[] {
	return Array.isArray(value) && value.every(isDeductabilityResult);
}
