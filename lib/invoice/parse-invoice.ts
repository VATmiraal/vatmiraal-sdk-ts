import { result, error, isError, type SafePromise } from 'result-interface';
import type { Client } from '../client/types';
import { requestJson, parseJsonResponse } from '../client/json';
import type {
	InvoiceJob,
	InvoiceJobResult,
	InvoiceMode,
	ParseInvoiceAsyncOptions,
	ParseInvoiceOptions,
	ParseInvoiceResponse
} from './invoice-types';
import { isInvoiceJob, isParseInvoiceResponse } from './invoice-guards';

/** A PDF invoice accepted by the parsing functions, as raw bytes or an already-wrapped Blob. */
type InvoiceFile = Blob | Uint8Array | ArrayBuffer;

/** Wrap the raw PDF bytes in a Blob the multipart upload can carry. */
function toBlob(file: InvoiceFile): Blob {
	if (file instanceof Blob) {
		return file;
	}
	return new Blob([file], { type: 'application/pdf' });
}

/** The `/parse-invoice` path with the optional `mode` query appended. */
function invoicePath(mode?: InvoiceMode): string {
	return mode ? `/parse-invoice?mode=${encodeURIComponent(mode)}` : '/parse-invoice';
}

/** The multipart body carrying the PDF under the `file` field the backend expects. */
function invoiceForm(file: InvoiceFile): FormData {
	const form = new FormData();
	form.append('file', toBlob(file), 'invoice.pdf');
	return form;
}

/** Extract the facts stated by a PDF invoice. */
export function parseInvoice(
	client: Client,
	file: InvoiceFile,
	options?: ParseInvoiceOptions
): SafePromise<ParseInvoiceResponse, Error> {
	return requestJson(client, invoicePath(options?.mode), isParseInvoiceResponse, {
		method: 'POST',
		headers: { Accept: 'application/json' },
		body: invoiceForm(file)
	});
}

/**
 * Submit a PDF invoice as an async job and return its id, without waiting for the reading. Poll
 * {@link getInvoiceJob} with the id to retrieve the result when it is ready.
 */
export function submitInvoiceJob(
	client: Client,
	file: InvoiceFile,
	options?: ParseInvoiceOptions
): SafePromise<InvoiceJob, Error> {
	return requestJson(client, invoicePath(options?.mode), isInvoiceJob, {
		method: 'POST',
		headers: { Accept: 'application/json', Prefer: 'respond-async' },
		body: invoiceForm(file)
	});
}

/** Parse a `Retry-After` header (whole seconds) into ms, or undefined when absent or unparseable. */
function retryAfterMs(headers: Headers): number | undefined {
	const raw = headers.get('Retry-After');
	if (raw === null) {
		return undefined;
	}
	const seconds = Number(raw);
	return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

/**
 * Fetch the state of an async invoice job. Returns `{ status: 'pending' }` while the job is still
 * running (with the server's suggested wait as `retryAfterMs`), otherwise the terminal reading.
 */
export async function getInvoiceJob(
	client: Client,
	jobId: string
): SafePromise<InvoiceJobResult, Error> {
	const path = `/parse-invoice/${encodeURIComponent(jobId)}`;
	const res = await client.request(path, { method: 'GET' });
	if (isError(res)) {
		return res;
	}
	if (res.value.status === 202) {
		return result({ status: 'pending', retryAfterMs: retryAfterMs(res.value.headers) });
	}
	return parseJsonResponse(res.value, path, isParseInvoiceResponse);
}

/** Default wait between polls when the server gives no `Retry-After`. */
const DEFAULT_POLL_INTERVAL_MS = 2000;

/** Default total time to keep polling before giving up. */
const DEFAULT_MAX_WAIT_MS = 600_000;

/** Resolve after `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Submit a PDF invoice as an async job and poll until it finishes, returning the terminal reading.
 * The poll interval follows the server's `Retry-After` (overridable via `pollIntervalMs`); polling
 * gives up with an error after `maxWaitMs` in total.
 */
export async function parseInvoiceAsync(
	client: Client,
	file: InvoiceFile,
	options?: ParseInvoiceAsyncOptions
): SafePromise<ParseInvoiceResponse, Error> {
	const submitted = await submitInvoiceJob(client, file, options);
	if (isError(submitted)) {
		return submitted;
	}
	const jobId = submitted.value.job_id;
	const deadline = Date.now() + (options?.maxWaitMs ?? DEFAULT_MAX_WAIT_MS);

	let polled = await getInvoiceJob(client, jobId);
	while (!isError(polled) && polled.value.status === 'pending' && Date.now() < deadline) {
		const interval =
			options?.pollIntervalMs ?? polled.value.retryAfterMs ?? DEFAULT_POLL_INTERVAL_MS;
		await sleep(Math.min(interval, deadline - Date.now()));
		polled = await getInvoiceJob(client, jobId);
	}
	if (isError(polled)) {
		return polled;
	}
	if (polled.value.status === 'pending') {
		return error(new Error(`parse-invoice job ${jobId} did not finish within the max wait`));
	}
	return result(polled.value);
}
