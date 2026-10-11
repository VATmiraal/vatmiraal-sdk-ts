import type { Country, PartyType, TransportBy } from '../common/domain-types';
import type { Metadata } from '../common/metadata-types';
import type { InferenceResult } from '../inference/inference-types';

/** The extraction path requested of the parser; `auto`/`vision-auto` resolve to a concrete one. */
export type InvoiceMode = 'auto' | 'bbox-text' | 'vision' | 'vision-transcribe' | 'vision-auto';

/** The concrete path the parser took to turn the PDF into model input. */
export type ExtractionMode = 'bbox-text' | 'vision' | 'vision-transcribe';

/** One billed line, as printed on the invoice. */
export interface LineItem {
	description: string;
	quantity: number | null;
	unit_price: number | null;
	amount: number;
	vat_rate: number | null;
}

/** The cross-border movement stated for a transaction. */
export interface InvoiceTransport {
	from: Country | null;
	to: Country | null;
	by: TransportBy | null;
}

/** One consistency check run over the extracted invoice. */
export interface Check {
	name: string;
	passed: boolean;
	detail: string;
	fields: string[];
}

/** The deterministic checklist outcome. */
export interface Validation {
	passed: boolean;
	checks: Check[];
}

/** How the reading was produced. */
export interface ExtractionInfo {
	mode: ExtractionMode;
	text_layer_present: boolean;
	escalated_from: ExtractionMode | null;
	page_count: number;
}

/** Run-level metadata: how the invoice was read and whether it is self-consistent. */
export interface InvoiceMetadata {
	extraction: ExtractionInfo;
	validation: Validation;
}

/** A supplier or receiver read off the invoice. */
export interface InvoiceParty {
	type: PartyType | null;
	vat_number: string;
	country: Country | null;
	metadata: Metadata;
}

/** One billed line's VAT facts, in EUR, keyed by id (e.g. `t1`) in {@link VatData}. */
export interface Transaction {
	object: InferenceResult;
	taxable_point: string | null;
	taxable_amount: number;
	vat_amount: number;
	transport: InvoiceTransport | null;
	metadata: Metadata;
}

/** The parties and the per-line transactions, keyed by id. */
export interface VatData {
	supplier: InvoiceParty;
	receiver: InvoiceParty;
	transactions: Record<string, Transaction>;
}

/** What the invoice states about itself, outside the VAT facts. */
export interface Document {
	invoice_number: string | null;
	vendor_name: string;
	issue_date: string | null;
	due_date: string | null;
	currency: string | null;
	subtotal: number;
	total: number;
	line_items: Record<string, LineItem[]>;
	extra: Record<string, string>;
	metadata: Metadata;
}

/** The facts read off an invoice, grouped by what consumes them. */
export interface ExtractedInvoice {
	vat_data: VatData;
	document: Document;
	metadata: InvoiceMetadata;
}

/**
 * The status-discriminated result of parsing an invoice. `valid` flattens the
 * {@link ExtractedInvoice} alongside the status; `validation_failed` carries the failed
 * checks and the data read despite them.
 */
export type ParseInvoiceResponse =
	| ({ status: 'valid' } & ExtractedInvoice)
	| {
			status: 'validation_failed';
			error: { kind: string; checks: Check[] };
			data: ExtractedInvoice;
	  };

/** Options for {@link parseInvoice}. */
export interface ParseInvoiceOptions {
	/** The extraction path; defaults to `auto` server-side when omitted. */
	mode?: InvoiceMode;
}
