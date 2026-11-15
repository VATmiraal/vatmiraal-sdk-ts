import type { SafePromise } from 'result-interface';
import type { Client } from '../client/types';
import { requestJson } from '../client/json';
import { requestBytes } from '../client/bytes';
import type { PricingConfig } from './pricing-types';
import { isPricingConfig } from './pricing-guards';

/** Fetch the latest pricing config. */
export function fetchPricing(client: Client): SafePromise<PricingConfig, Error> {
	return requestJson(client, '/pricing', isPricingConfig);
}

/** Fetch the latest rates contract PDF, in `lang` when given, English otherwise. */
export function fetchPricingContract(
	client: Client,
	lang?: string
): SafePromise<Uint8Array, Error> {
	return requestBytes(client, artifactPath('/pricing/contract', lang));
}

/** Fetch the latest Heimdall definition PDF, in `lang` when given, English otherwise. */
export function fetchPricingHeimdallDefinition(
	client: Client,
	lang?: string
): SafePromise<Uint8Array, Error> {
	return requestBytes(client, artifactPath('/pricing/heimdall_definition', lang));
}

function artifactPath(path: string, lang?: string): string {
	return lang ? `${path}?lang=${encodeURIComponent(lang)}` : path;
}
