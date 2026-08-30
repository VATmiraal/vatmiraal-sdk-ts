import { isRecord, isUnknownArray, isTaxGridResult } from '../analysis/tax-grid-output-guards';
import { isStringArray } from '../schema/schema-guards';
import type {
	AuditArg,
	AuditCapabilities,
	AuditDimension,
	AuditProperty,
	AuditScenario,
	AuditTrailer,
	NumericRange
} from './audit-types';

export function isNumericRange(value: unknown): value is NumericRange {
	return isRecord(value) && 'min' in value && 'max' in value;
}

export function isAuditArg(value: unknown): value is AuditArg {
	return (
		isNumericRange(value) ||
		value === null ||
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	);
}

export function isAuditProperty(value: unknown): value is AuditProperty {
	return (
		isRecord(value) &&
		typeof value.type === 'string' &&
		isUnknownArray(value.args) &&
		value.args.every(isAuditArg)
	);
}

function isAuditPropertyArray(value: unknown): value is AuditProperty[] {
	return isUnknownArray(value) && value.every(isAuditProperty);
}

export function isAuditScenario(value: unknown): value is AuditScenario {
	return (
		isRecord(value) &&
		typeof value.supplier_type === 'string' &&
		typeof value.supplier_country === 'string' &&
		typeof value.receiver_type === 'string' &&
		typeof value.receiver_country === 'string' &&
		typeof value.transaction_type === 'string' &&
		isAuditPropertyArray(value.supplier_properties) &&
		isAuditPropertyArray(value.customer_properties) &&
		isAuditPropertyArray(value.object_properties) &&
		isUnknownArray(value.grids) &&
		value.grids.every(isTaxGridResult)
	);
}

export function isAuditTrailer(value: unknown): value is AuditTrailer {
	return (
		isRecord(value) &&
		typeof value.done === 'boolean' &&
		typeof value.count === 'number' &&
		typeof value.truncated === 'boolean' &&
		typeof value.reason === 'string'
	);
}

export function isAuditDimension(value: unknown): value is AuditDimension {
	return (
		isRecord(value) &&
		typeof value.field === 'string' &&
		typeof value.label === 'string' &&
		typeof value.mode === 'string' &&
		typeof value.control === 'string' &&
		(value.values_from === undefined || typeof value.values_from === 'string') &&
		(value.values === undefined || isStringArray(value.values)) &&
		(value.classes_from === undefined || typeof value.classes_from === 'string') &&
		(value.description === undefined || typeof value.description === 'string')
	);
}

export function isAuditCapabilities(value: unknown): value is AuditCapabilities {
	return (
		isRecord(value) &&
		typeof value.response_type === 'string' &&
		isRecord(value.conventions) &&
		isUnknownArray(value.dimensions) &&
		value.dimensions.every(isAuditDimension)
	);
}
