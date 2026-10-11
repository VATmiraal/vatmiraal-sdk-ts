import { describe, it, expect, vi } from 'vitest';
import 'result-interface/vitest';
import { result } from 'result-interface';
import type { Client } from '../../lib/client/types';
import { parseInvoice } from '../../lib/invoice/parse-invoice';

const meta = (field: string, comment: string) => ({
	[field]: { confidence: 'high', comment }
});

const INVOICE = {
	vat_data: {
		supplier: {
			type: 'company',
			vat_number: 'BE0123456789',
			country: 'belgium',
			metadata: meta('country', 'Belgian address')
		},
		receiver: {
			// the Go layer maps the "unknown" sentinel to null at the client boundary
			type: null,
			vat_number: '',
			country: null,
			metadata: meta('vat_number', 'no VAT stated')
		},
		transactions: {
			t1: {
				object: { candidates: [] },
				taxable_point: '2026-01-01',
				taxable_amount: 100,
				vat_amount: 21,
				transport: null,
				metadata: meta('vat_amount', 'BTW 21% line')
			}
		}
	},
	document: {
		invoice_number: 'INV-1',
		vendor_name: 'Acme',
		issue_date: '2026-01-01',
		due_date: null,
		currency: 'EUR',
		subtotal: 100,
		total: 121,
		line_items: {
			t1: [{ description: 'widget', quantity: 1, unit_price: 100, amount: 100, vat_rate: 21 }]
		},
		extra: {},
		metadata: meta('total', 'invoice total')
	},
	metadata: {
		extraction: {
			mode: 'bbox-text',
			text_layer_present: true,
			escalated_from: null,
			page_count: 1
		},
		validation: { passed: true, checks: [] }
	}
};

const VALID = { status: 'valid', ...INVOICE };
const FAILED = {
	status: 'validation_failed',
	error: {
		kind: 'validation_failed',
		checks: [
			{ name: 'totals', passed: false, detail: 'subtotal + vat != total', fields: ['total'] }
		]
	},
	data: INVOICE
};

function clientReturning(body: unknown) {
	const send = vi.fn().mockResolvedValue(result(new Response(JSON.stringify(body))));
	const client: Client = { options: { token: 't' }, request: send };
	return { client, send };
}

describe(parseInvoice.name, () => {
	it('POSTs the PDF to /parse-invoice as multipart and parses a valid reading', async () => {
		const { client, send } = clientReturning(VALID);

		expect(await parseInvoice(client, new Blob([new Uint8Array([1, 2, 3])]))).toBeResult(VALID);

		const [path, init] = send.mock.calls[0]!;
		expect(path).toBe('/parse-invoice');
		expect(init.method).toBe('POST');
		expect(init.body).toBeInstanceOf(FormData);
		expect((init.body as FormData).get('file')).toBeInstanceOf(Blob);
		// fetch sets the multipart boundary itself, so the SDK must not pin a Content-Type.
		expect(init.headers).not.toHaveProperty('Content-Type');
	});

	it('parses a validation_failed reading, carrying the data read', async () => {
		const { client } = clientReturning(FAILED);
		expect(await parseInvoice(client, new Blob([new Uint8Array([1])]))).toBeResult(FAILED);
	});

	it('appends the mode query when given', async () => {
		const { client, send } = clientReturning(VALID);
		await parseInvoice(client, new Blob([new Uint8Array([1])]), { mode: 'vision' });
		expect(send.mock.calls[0]![0]).toBe('/parse-invoice?mode=vision');
	});

	it.each([
		['Uint8Array', new Uint8Array([1, 2, 3])],
		['ArrayBuffer', new Uint8Array([1, 2, 3]).buffer],
		['Blob', new Blob([new Uint8Array([1, 2, 3])], { type: 'application/pdf' })]
	])('accepts a %s file argument', async (_label, file) => {
		const { client, send } = clientReturning(VALID);
		await parseInvoice(client, file);
		const body = send.mock.calls[0]![1].body as FormData;
		expect(body.get('file')).toBeInstanceOf(Blob);
	});

	it('errors when the payload is not a parse-invoice response', async () => {
		const { client } = clientReturning({ status: 'nope' });
		expect(await parseInvoice(client, new Blob([new Uint8Array([1])]))).toBeError();
	});
});
