/**
 * Validating factories and type guards that enforce the VATmiraal contract at runtime.
 *
 * Each factory checks a plain interface against the current vocabulary and returns a {@link Safe}
 * value on success; each `isSafe*` guard narrows a value to its `Safe` form. This is where the
 * enums modelled as `string` are confirmed against the vocabulary the API reports.
 *
 * @module
 */

export type { DeepReadonly, Safe } from './safe';
export type { ValidationError } from './errors';
export { transport, isSafeTransport } from './transport';
export { party, isSafeParty } from './party';
export { analysisObject, isSafeAnalysisObject } from './analysis-object';
export { transaction, isSafeTransaction } from './transaction';
export { taxGridAnalysisRequest, isSafeTaxGridAnalysisRequest } from './request';
