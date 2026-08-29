import type { SafePromise } from 'result-interface';
import type { Client } from '../client/types';
import { requestJson } from '../client/json';
import { PATH_TAX_GRID_ANALYSIS } from '../client/endpoints';
import type { DeepReadonly } from '../common/safe/safe';
import type { TaxGridAnalysisRequest } from './tax-grid-input-types';
import type { TaxGridAnalysisResponse } from './tax-grid-output-types';
import { isTaxGridAnalysisResponse } from './tax-grid-output-guards';

/**
 * Analyse a transaction and get the tax grids it maps to, along with any warnings and
 * inconsistencies raised about it. Accepts a plain request or a validated `Safe<...>` one.
 */
export function analyzeTaxGrid(
	client: Client,
	request: DeepReadonly<TaxGridAnalysisRequest>
): SafePromise<TaxGridAnalysisResponse, Error> {
	return requestJson(client, PATH_TAX_GRID_ANALYSIS, isTaxGridAnalysisResponse, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(request)
	});
}
