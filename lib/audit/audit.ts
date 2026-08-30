import { result, isError, type SafePromise } from 'result-interface';
import type { Client } from '../client/types';
import { requestJson } from '../client/json';
import { streamLines } from '../client/stream';
import { isRecord } from '../analysis/tax-grid-output-guards';
import type { AuditCapabilities, AuditRequest, AuditScenario, AuditTrailer } from './audit-types';
import { isAuditCapabilities, isAuditScenario, isAuditTrailer } from './audit-guards';

/** Fetch the descriptor of the audit input model: its dimensions and how to ground them. */
export function fetchAuditCapabilities(client: Client): SafePromise<AuditCapabilities, Error> {
	return requestJson(client, '/audit/capabilities', isAuditCapabilities);
}

/**
 * Run an audit: search the input scenarios that produce the target grids. The outer Result covers
 * the setup — a transport failure or a non-ok status (such as `503` when the audit queue is full)
 * resolves as an error. On success it resolves to an async generator that yields each
 * {@link AuditScenario} as it streams in and returns the terminal {@link AuditTrailer} once the
 * search ends:
 *
 * ```ts
 * const stream = await auditScenarios(client, request);
 * if (isError(stream)) throw stream.error;
 * for await (const scenario of stream.value) render(scenario);
 * ```
 *
 * The generator throws if the service reports an engine error mid-stream, if a streamed line is
 * neither a scenario nor the trailer, or if the stream ends without a trailer.
 */
export async function auditScenarios(
	client: Client,
	request: AuditRequest
): SafePromise<AsyncGenerator<AuditScenario, AuditTrailer, void>, Error> {
	const lines = await streamLines(client, '/audit', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
		body: JSON.stringify(request)
	});
	if (isError(lines)) {
		return lines;
	}
	return result(parseScenarios(lines.value));
}

async function* parseScenarios(
	lines: AsyncGenerator<string, void, void>
): AsyncGenerator<AuditScenario, AuditTrailer, void> {
	for await (const line of lines) {
		const parsed = JSON.parse(line) as unknown;
		if (isAuditTrailer(parsed)) {
			return parsed;
		}
		if (isAuditScenario(parsed)) {
			yield parsed;
			continue;
		}
		if (isRecord(parsed) && typeof parsed.error === 'string') {
			throw new Error(parsed.error);
		}
		throw new Error('audit stream returned an unexpected line');
	}
	throw new Error('audit stream ended without a trailer');
}
