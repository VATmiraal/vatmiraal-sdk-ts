import type {
	TaxGridAnalysisResponse,
	TaxGridResult,
	Justification,
	JustificationContext,
	LegalReference,
	Warning
} from './tax-grid-output-types';

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function isUnknownArray(value: unknown): value is unknown[] {
	return Array.isArray(value);
}

export function isLegalReference(value: unknown): value is LegalReference {
	if (!isRecord(value)) {
		return false;
	}
	if (value.no_basis === true) {
		return true;
	}
	if (typeof value.code === 'string') {
		return true;
	}
	return (
		typeof value.article === 'string' &&
		typeof value.paragraph === 'string' &&
		typeof value.section === 'string' &&
		typeof value.subsection === 'string' &&
		typeof value.book === 'string'
	);
}

export function isJustificationContext(value: unknown): value is JustificationContext {
	return (
		isRecord(value) &&
		(value.type === 'place' || value.type === 'debtor' || value.type === 'does_not_apply')
	);
}

export function isJustification(value: unknown): value is Justification {
	return (
		isRecord(value) &&
		isLegalReference(value.legal_reference) &&
		typeof value.justification === 'string' &&
		typeof value.applies === 'boolean' &&
		(value.context === undefined || isJustificationContext(value.context))
	);
}

export function isTaxGridResult(value: unknown): value is TaxGridResult {
	return (
		isRecord(value) &&
		typeof value.grid === 'string' &&
		typeof value.amount === 'number' &&
		isUnknownArray(value.justifications) &&
		value.justifications.every(isJustification)
	);
}

export function isWarning(value: unknown): value is Warning {
	return (
		isRecord(value) &&
		typeof value.type === 'string' &&
		isRecord(value.data) &&
		typeof value.justification === 'string'
	);
}

export function isTaxGridAnalysisResponse(value: unknown): value is TaxGridAnalysisResponse {
	if (!isRecord(value) || !isUnknownArray(value.warnings) || !value.warnings.every(isWarning)) {
		return false;
	}
	if (value.status === 'consistent') {
		return isUnknownArray(value.grids) && value.grids.every(isTaxGridResult);
	}
	if (value.status === 'inconsistent') {
		return isUnknownArray(value.inconsistencies) && value.inconsistencies.every(isWarning);
	}
	return false;
}
