// Compile-time conformance: the SDK's public types must declare the same field names as the
// service's OpenAPI schema. A `tsc` error here means the API has drifted (a field renamed, added,
// or removed) from what the SDK sends or parses. To refresh: re-capture the spec into
// test/fixtures/openapi.json, run `bun run gen:api`, then reconcile the SDK types below.
//
// Field name conformance only: enum widening (the SDK uses `string`) and the spec's nullable
// arrays are deliberate modelling differences, so value/type checks stay with the runtime guards
// and the live-schema validation.

import type { components } from '../lib/generated/api';
import type {
	AnalysisObject,
	Candidate,
	InferenceRequest,
	InferenceResult,
	ObjectCategory,
	Party,
	PropertyArg,
	PropertySpec,
	TaxGridAnalysisRequest,
	TaxGridAnalysisResponse,
	TaxGridResult,
	Transport,
	VatmiraalAnalysisInput,
	VatTemplate,
	VatValidationInput,
	VatValidationOutput,
	Warning
} from '../index';

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
/** True only when two object types declare exactly the same set of field names. */
type SameKeys<Sdk, Gen> = Equal<keyof Sdk, keyof Gen>;

type Schemas = components['schemas'];
type Consistent = Extract<TaxGridAnalysisResponse, { status: 'consistent' }>;
type Inconsistent = Extract<TaxGridAnalysisResponse, { status: 'inconsistent' }>;

export type ApiConformance = [
	// Requests: the shapes the SDK sends.
	Expect<SameKeys<TaxGridAnalysisRequest, Schemas['ReqInputBoxInput']>>,
	Expect<SameKeys<VatmiraalAnalysisInput, Schemas['VatmiraalAnalysisInput']>>,
	Expect<SameKeys<Party, Schemas['Party']>>,
	Expect<SameKeys<AnalysisObject, Schemas['Object']>>,
	Expect<SameKeys<Transport, Schemas['Transport']>>,
	Expect<SameKeys<VatValidationInput, Schemas['VatValidationInput']>>,
	Expect<SameKeys<InferenceRequest, Schemas['InferenceRequest']>>,

	// Responses: the shapes the SDK parses.
	Expect<SameKeys<Consistent, Schemas['ConsistentAnalysis']>>,
	Expect<SameKeys<Inconsistent, Schemas['InconsistentAnalysis']>>,
	Expect<SameKeys<TaxGridResult, Schemas['BoxAnalysisResult']>>,
	Expect<SameKeys<Warning, Schemas['Warning']>>,
	Expect<SameKeys<VatValidationOutput, Schemas['VatValidationOutput']>>,
	Expect<SameKeys<InferenceResult, Schemas['InferedObject']>>,
	Expect<SameKeys<Candidate, Schemas['Candidate']>>,
	Expect<SameKeys<ObjectCategory, Schemas['ObjectCategory']>>,
	Expect<SameKeys<PropertySpec, Schemas['Property']>>,
	Expect<SameKeys<PropertyArg, Schemas['PropertyArg']>>,
	Expect<SameKeys<VatTemplate, Schemas['VatTemplate']>>,
	Expect<SameKeys<{ alive: boolean }, Schemas['HealthOutputBody']>>
];
