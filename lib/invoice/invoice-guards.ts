import { isRecord, isStringArray } from '../common/guards';
import { isInferenceResult, isMetadata } from '../inference/inference-guards';
import type {
	Check,
	Document,
	ExtractedInvoice,
	ExtractionInfo,
	InvoiceMetadata,
	InvoiceParty,
	InvoiceTransport,
	LineItem,
	ParseInvoiceResponse,
	Transaction,
	Validation,
	VatData
} from './invoice-types';

function isNumberOrNull(value: unknown): value is number | null {
	return value === null || typeof value === 'number';
}

function isStringOrNull(value: unknown): value is string | null {
	return value === null || typeof value === 'string';
}

function isExtractionMode(value: unknown): value is 'bbox-text' | 'vision' | 'vision-transcribe' {
	return value === 'bbox-text' || value === 'vision' || value === 'vision-transcribe';
}

function isStringRecord(value: unknown): value is Record<string, string> {
	return isRecord(value) && Object.values(value).every((v) => typeof v === 'string');
}

export function isCheck(value: unknown): value is Check {
	return (
		isRecord(value) &&
		typeof value.name === 'string' &&
		typeof value.passed === 'boolean' &&
		typeof value.detail === 'string' &&
		isStringArray(value.fields)
	);
}

export function isLineItem(value: unknown): value is LineItem {
	return (
		isRecord(value) &&
		typeof value.description === 'string' &&
		isNumberOrNull(value.quantity) &&
		isNumberOrNull(value.unit_price) &&
		typeof value.amount === 'number' &&
		isNumberOrNull(value.vat_rate)
	);
}

export function isInvoiceTransport(value: unknown): value is InvoiceTransport {
	return (
		isRecord(value) &&
		isStringOrNull(value.from) &&
		isStringOrNull(value.to) &&
		isStringOrNull(value.by)
	);
}

export function isValidation(value: unknown): value is Validation {
	return (
		isRecord(value) &&
		typeof value.passed === 'boolean' &&
		Array.isArray(value.checks) &&
		value.checks.every(isCheck)
	);
}

export function isExtractionInfo(value: unknown): value is ExtractionInfo {
	return (
		isRecord(value) &&
		isExtractionMode(value.mode) &&
		typeof value.text_layer_present === 'boolean' &&
		(value.escalated_from === null || isExtractionMode(value.escalated_from)) &&
		typeof value.page_count === 'number'
	);
}

export function isInvoiceMetadata(value: unknown): value is InvoiceMetadata {
	return isRecord(value) && isExtractionInfo(value.extraction) && isValidation(value.validation);
}

export function isInvoiceParty(value: unknown): value is InvoiceParty {
	return (
		isRecord(value) &&
		isStringOrNull(value.type) &&
		typeof value.vat_number === 'string' &&
		isStringOrNull(value.country) &&
		isMetadata(value.metadata)
	);
}

export function isTransaction(value: unknown): value is Transaction {
	return (
		isRecord(value) &&
		isInferenceResult(value.object) &&
		isStringOrNull(value.taxable_point) &&
		typeof value.taxable_amount === 'number' &&
		typeof value.vat_amount === 'number' &&
		(value.transport === null || isInvoiceTransport(value.transport)) &&
		isMetadata(value.metadata)
	);
}

export function isVatData(value: unknown): value is VatData {
	return (
		isRecord(value) &&
		isInvoiceParty(value.supplier) &&
		isInvoiceParty(value.receiver) &&
		isRecord(value.transactions) &&
		Object.values(value.transactions).every(isTransaction)
	);
}

export function isDocument(value: unknown): value is Document {
	return (
		isRecord(value) &&
		isStringOrNull(value.invoice_number) &&
		typeof value.vendor_name === 'string' &&
		isStringOrNull(value.issue_date) &&
		isStringOrNull(value.due_date) &&
		isStringOrNull(value.currency) &&
		typeof value.subtotal === 'number' &&
		typeof value.total === 'number' &&
		isRecord(value.line_items) &&
		Object.values(value.line_items).every(
			(items) => Array.isArray(items) && items.every(isLineItem)
		) &&
		isStringRecord(value.extra) &&
		isMetadata(value.metadata)
	);
}

export function isExtractedInvoice(value: unknown): value is ExtractedInvoice {
	return (
		isRecord(value) &&
		isVatData(value.vat_data) &&
		isDocument(value.document) &&
		isInvoiceMetadata(value.metadata)
	);
}

/** True when `value` is a well-formed {@link ParseInvoiceResponse}. */
export function isParseInvoiceResponse(value: unknown): value is ParseInvoiceResponse {
	if (!isRecord(value)) {
		return false;
	}
	if (value.status === 'valid') {
		return isExtractedInvoice(value);
	}
	if (value.status === 'validation_failed') {
		return (
			isRecord(value.error) &&
			typeof value.error.kind === 'string' &&
			Array.isArray(value.error.checks) &&
			value.error.checks.every(isCheck) &&
			isExtractedInvoice(value.data)
		);
	}
	return false;
}
