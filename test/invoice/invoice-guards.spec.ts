import { describe, it, expect } from 'vitest';
import {
	isCheck,
	isDocument,
	isExtractedInvoice,
	isExtractionInfo,
	isInvoiceMetadata,
	isInvoiceParty,
	isInvoiceTransport,
	isLineItem,
	isParseInvoiceResponse,
	isTransaction,
	isValidation,
	isVatData
} from '../../lib/invoice/invoice-guards';

const META = { f: { confidence: 'high', comment: 'c' } };
const CHECK = { name: 'totals', passed: false, detail: 'x', fields: ['total'] };
const LINE_ITEM = { description: 'w', quantity: 1, unit_price: 2, amount: 3, vat_rate: 21 };
const TRANSPORT = { from: 'belgium', to: 'france', by: 'seller' };
const EXTRACTION = {
	mode: 'vision',
	text_layer_present: true,
	escalated_from: null,
	page_count: 1
};
const VALIDATION = { passed: true, checks: [CHECK] };
const INVOICE_META = { extraction: EXTRACTION, validation: VALIDATION };
const PARTY = { type: 'company', vat_number: 'BE0', country: 'belgium', metadata: META };
const TRANSACTION = {
	object: { candidates: [] },
	taxable_point: '2026-01-01',
	taxable_amount: 100,
	vat_amount: 21,
	transport: TRANSPORT,
	metadata: META
};
const VAT_DATA = { supplier: PARTY, receiver: PARTY, transactions: { t1: TRANSACTION } };
const DOCUMENT = {
	invoice_number: 'INV-1',
	vendor_name: 'Acme',
	issue_date: '2026-01-01',
	due_date: null,
	currency: 'EUR',
	subtotal: 100,
	total: 121,
	line_items: { t1: [LINE_ITEM] },
	extra: { po: '42' },
	metadata: META
};
const INVOICE = { vat_data: VAT_DATA, document: DOCUMENT, metadata: INVOICE_META };

/** Assert the guard rejects the base object with each single-field override applied. */
function rejectsEach<T>(guard: (v: unknown) => v is T, base: object, overrides: object[]) {
	for (const override of overrides) {
		expect(guard({ ...base, ...override })).toBe(false);
	}
}

describe(isCheck.name, () => {
	it('accepts a well-formed check and rejects each malformed field', () => {
		expect(isCheck(CHECK)).toBe(true);
		expect(isCheck(null)).toBe(false);
		rejectsEach(isCheck, CHECK, [{ name: 1 }, { passed: 'no' }, { detail: 1 }, { fields: [1] }]);
	});
});

describe(isLineItem.name, () => {
	it('accepts numeric and null optionals', () => {
		expect(isLineItem(LINE_ITEM)).toBe(true);
		expect(isLineItem({ ...LINE_ITEM, quantity: null, unit_price: null, vat_rate: null })).toBe(
			true
		);
	});
	it('rejects malformed fields', () => {
		expect(isLineItem(null)).toBe(false);
		rejectsEach(isLineItem, LINE_ITEM, [
			{ description: 1 },
			{ quantity: 'x' },
			{ unit_price: 'x' },
			{ amount: null },
			{ vat_rate: 'x' }
		]);
	});
});

describe(isInvoiceTransport.name, () => {
	it('accepts null or string legs and rejects others', () => {
		expect(isInvoiceTransport(TRANSPORT)).toBe(true);
		expect(isInvoiceTransport({ from: null, to: null, by: null })).toBe(true);
		expect(isInvoiceTransport(null)).toBe(false);
		rejectsEach(isInvoiceTransport, TRANSPORT, [{ from: 1 }, { to: 1 }, { by: 1 }]);
	});
});

describe(isValidation.name, () => {
	it('accepts a well-formed validation and rejects malformed ones', () => {
		expect(isValidation(VALIDATION)).toBe(true);
		expect(isValidation(null)).toBe(false);
		rejectsEach(isValidation, VALIDATION, [{ passed: 'no' }, { checks: 'x' }, { checks: [null] }]);
	});
});

describe(isExtractionInfo.name, () => {
	it('accepts known modes and a null or bbox-text escalation', () => {
		expect(isExtractionInfo(EXTRACTION)).toBe(true);
		expect(isExtractionInfo({ ...EXTRACTION, escalated_from: 'bbox-text' })).toBe(true);
	});
	it('rejects malformed fields', () => {
		expect(isExtractionInfo(null)).toBe(false);
		rejectsEach(isExtractionInfo, EXTRACTION, [
			{ mode: 'auto' },
			{ text_layer_present: 'yes' },
			{ escalated_from: 'nope' },
			{ page_count: '1' }
		]);
	});
});

describe(isInvoiceMetadata.name, () => {
	it('accepts and rejects', () => {
		expect(isInvoiceMetadata(INVOICE_META)).toBe(true);
		expect(isInvoiceMetadata(null)).toBe(false);
		rejectsEach(isInvoiceMetadata, INVOICE_META, [{ extraction: {} }, { validation: {} }]);
	});
});

describe(isInvoiceParty.name, () => {
	it('accepts string or null type/country and rejects malformed ones', () => {
		expect(isInvoiceParty(PARTY)).toBe(true);
		expect(isInvoiceParty({ ...PARTY, type: null, country: null })).toBe(true);
		expect(isInvoiceParty(null)).toBe(false);
		rejectsEach(isInvoiceParty, PARTY, [
			{ type: 1 },
			{ vat_number: 1 },
			{ country: 1 },
			{ metadata: 'x' }
		]);
	});
});

describe(isTransaction.name, () => {
	it('accepts null transport and taxable_point, rejects malformed fields', () => {
		expect(isTransaction(TRANSACTION)).toBe(true);
		expect(isTransaction({ ...TRANSACTION, transport: null, taxable_point: null })).toBe(true);
		expect(isTransaction(null)).toBe(false);
		rejectsEach(isTransaction, TRANSACTION, [
			{ object: {} },
			{ taxable_point: 1 },
			{ taxable_amount: 'x' },
			{ vat_amount: 'x' },
			{ transport: 'x' },
			{ metadata: 'x' }
		]);
	});
});

describe(isVatData.name, () => {
	it('accepts and rejects malformed parts', () => {
		expect(isVatData(VAT_DATA)).toBe(true);
		expect(isVatData(null)).toBe(false);
		rejectsEach(isVatData, VAT_DATA, [
			{ supplier: {} },
			{ receiver: {} },
			{ transactions: 'x' },
			{ transactions: { t1: {} } }
		]);
	});
});

describe(isDocument.name, () => {
	it('accepts and rejects malformed fields', () => {
		expect(isDocument(DOCUMENT)).toBe(true);
		expect(
			isDocument({ ...DOCUMENT, invoice_number: null, issue_date: null, currency: null })
		).toBe(true);
		expect(isDocument(null)).toBe(false);
		rejectsEach(isDocument, DOCUMENT, [
			{ invoice_number: 1 },
			{ vendor_name: 1 },
			{ issue_date: 1 },
			{ due_date: 1 },
			{ currency: 1 },
			{ subtotal: 'x' },
			{ total: 'x' },
			{ line_items: 'x' },
			{ line_items: { t1: 'x' } },
			{ line_items: { t1: [null] } },
			{ extra: { k: 1 } },
			{ metadata: 'x' }
		]);
	});
});

describe(isExtractedInvoice.name, () => {
	it('accepts and rejects malformed parts', () => {
		expect(isExtractedInvoice(INVOICE)).toBe(true);
		expect(isExtractedInvoice(null)).toBe(false);
		rejectsEach(isExtractedInvoice, INVOICE, [
			{ vat_data: {} },
			{ document: {} },
			{ metadata: {} }
		]);
	});
});

describe(isParseInvoiceResponse.name, () => {
	it('accepts a valid reading', () => {
		expect(isParseInvoiceResponse({ status: 'valid', ...INVOICE })).toBe(true);
	});
	it('accepts a validation_failed reading', () => {
		expect(
			isParseInvoiceResponse({
				status: 'validation_failed',
				error: { kind: 'validation_failed', checks: [CHECK] },
				data: INVOICE
			})
		).toBe(true);
	});
	it('rejects a non-record, an unknown status, and a malformed valid reading', () => {
		expect(isParseInvoiceResponse(null)).toBe(false);
		expect(isParseInvoiceResponse({ status: 'nope' })).toBe(false);
		expect(isParseInvoiceResponse({ status: 'valid', vat_data: {} })).toBe(false);
	});
	it('rejects a validation_failed reading with a malformed error or data', () => {
		const base = {
			status: 'validation_failed',
			error: { kind: 'x', checks: [CHECK] },
			data: INVOICE
		};
		rejectsEach(isParseInvoiceResponse, base, [
			{ error: { kind: 1, checks: [CHECK] } },
			{ error: { kind: 'x', checks: 'nope' } },
			{ error: { kind: 'x', checks: [null] } },
			{ error: 'x' },
			{ data: {} }
		]);
	});
});
