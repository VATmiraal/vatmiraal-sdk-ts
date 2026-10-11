import type { SafePromise } from 'result-interface';
import type { Client } from '../client/types';
import { requestJson } from '../client/json';
import type { ParseInvoiceOptions, ParseInvoiceResponse } from './invoice-types';
import { isParseInvoiceResponse } from './invoice-guards';

/** Wrap the raw PDF bytes in a Blob the multipart upload can carry. */
function toBlob(file: Blob | Uint8Array | ArrayBuffer): Blob {
	if (file instanceof Blob) {
		return file;
	}
	return new Blob([file], { type: 'application/pdf' });
}

/** Extract the facts stated by a PDF invoice. */
export function parseInvoice(
	client: Client,
	file: Blob | Uint8Array | ArrayBuffer,
	options?: ParseInvoiceOptions
): SafePromise<ParseInvoiceResponse, Error> {
	const path = options?.mode
		? `/parse-invoice?mode=${encodeURIComponent(options.mode)}`
		: '/parse-invoice';
	const form = new FormData();
	form.append('file', toBlob(file), 'invoice.pdf');
	return requestJson(client, path, isParseInvoiceResponse, {
		method: 'POST',
		headers: { Accept: 'application/json' },
		body: form
	});
}
