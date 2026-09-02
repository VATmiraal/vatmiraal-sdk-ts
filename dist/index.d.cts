import { SafePromise, Result } from 'result-interface';

/** Options common to every authentication mode. */
interface CommonOptions {
    /** Base URL of the service. Defaults to the production URL. Should not end with a slash. */
    baseUrl?: string;
}
/** Authenticate with a bearer token, sent as `Authorization: Bearer <token>`. */
interface TokenOptions extends CommonOptions {
    token: string;
    credentials?: never;
}
/** Authenticate with an OAuth session cookie, sent by setting the request credentials mode. */
interface OAuthOptions extends CommonOptions {
    /**
     * How the browser attaches cookies to each request. Set to `'include'`: the service is a
     * different origin, and the session cookie is only sent when credentials are included.
     */
    credentials: RequestInit['credentials'];
    token?: never;
}
/** Options for a {@link VatmiraalClient}. Provide a token or credentials, not both. */
type VatmiraalClientOptions = TokenOptions | OAuthOptions;
/**
 * The request surface the API functions depend on. {@link VatmiraalClient} is the standard
 * implementation; a unit test, or an implementor wanting different reconnect behavior, can
 * provide its own.
 */
interface Client {
    /** The options this client was created with. */
    readonly options: VatmiraalClientOptions;
    /**
     * Perform a request and resolve its `Response` as a Result, never throwing. A non-ok status
     * (4xx/5xx) still resolves as an ok Result carrying that `Response`; only a transport failure
     * resolves as an error.
     */
    request(path: string, init?: RequestInit): SafePromise<Response, Error>;
}

/** Base URL used when options omit `baseUrl`. */
declare const DEFAULT_BASE_URL = "https://api.vatmiraal.be";
/**
 * The standard {@link Client}: reaches the service at `baseUrl` and authenticates each request
 * with the configured token or credentials.
 */
declare class VatmiraalClient implements Client {
    readonly options: VatmiraalClientOptions;
    constructor(options: VatmiraalClientOptions);
    /** Base URL requests are made relative to, with the default applied. */
    get baseUrl(): string;
    request(path: string, init?: RequestInit): SafePromise<Response, Error>;
    private applyAuth;
}

/** The error body returned on a failed request. */
interface ApiErrorBody {
    /** Machine-readable error code. */
    type: string;
    /** Human-readable explanation of the error. */
    message: string;
    /** Optional error-specific details. */
    extra?: unknown;
}
/** True when `value` is a well-formed {@link ApiErrorBody}. */
declare function isApiErrorBody(value: unknown): value is ApiErrorBody;
/** An error returned by the API, carrying its HTTP status, error code, message, and details. */
declare class ApiError extends Error {
    /** HTTP status of the failed response. */
    readonly status: number;
    /** Machine-readable error code. */
    readonly type: string;
    /** Optional error-specific details. */
    readonly extra?: unknown | undefined;
    constructor(
    /** HTTP status of the failed response. */
    status: number, 
    /** Machine-readable error code. */
    type: string, message: string, 
    /** Optional error-specific details. */
    extra?: unknown | undefined);
}
/**
 * Build the error for a non-ok `Response`. Returns an {@link ApiError} when the body is a
 * well-formed {@link ApiErrorBody}, and a generic `Error` naming the path and status otherwise.
 */
declare function apiErrorFromResponse(response: Response, path: string): Promise<Error>;

/**
 * Request `path` through `client` and stream its response body as decoded text lines. The outer
 * Result covers the setup: a transport failure or a non-ok status resolves as an error (mapped
 * through {@link apiErrorFromResponse}), and a response with no body resolves as an error too. On
 * success it resolves to an async generator that yields each newline-delimited line, with empty
 * lines skipped, as it arrives.
 */
declare function streamLines(client: Client, path: string, init?: RequestInit): SafePromise<AsyncGenerator<string, void, void>, Error>;

/** Check whether the service is alive. */
declare function ping(client: Client): SafePromise<boolean, Error>;

/**
 * The VATmiraal enums shared across the client's modules.
 *
 * The API dictates which values each of these vocabularies allows, and that set can change,
 * so they cannot be pinned to string-literal unions at compile time. They are modelled as
 * `string`, and a value can only be confirmed valid at runtime against the vocabulary the API
 * reports (loaded through the schema module). The plain interfaces are typed with these enums
 * but do not themselves enforce the contract; to enforce it, use the validating factories and
 * type guards from the {@link safe} module to check a value, or a whole interface, against the
 * current vocabulary, yielding a {@link Safe} value that is guaranteed to hold only valid vocabulary.
 *
 * @module
 */
/**
 * A country the VAT rules recognise.
 *
 * @example 'belgium'
 */
type Country = string;
/**
 * The role or status of a party to the transaction.
 *
 * @example 'company' // also 'individual', 'non_taxable_legal_entity'
 */
type PartyType = string;
/**
 * The kind of transaction being analysed.
 *
 * @example 'service' // also 'delivery', 'transfer_of_goods', 'ic_acquisition', 'out_of_scope'
 */
type TransactionType = string;
/**
 * The category of the good or service being transacted.
 *
 * @example 'general_service'
 */
type ObjectType = string;
/**
 * Who is responsible for transporting the object.
 *
 * @example 'transport_by_seller' // also 'transport_on_account_of_seller', 'transport_by_buyer', 'transport_on_account_of_buyer'
 */
type TransportBy = string;

declare const valid: unique symbol;
/** Recursively mark every property, and every array, of `T` as readonly. */
type DeepReadonly<T> = T extends (infer U)[] ? ReadonlyArray<DeepReadonly<U>> : T extends object ? {
    readonly [K in keyof T]: DeepReadonly<T[K]>;
} : T;
/**
 * A `T` that has passed validation: deeply readonly, so it cannot be changed, and branded, so it
 * can only come from a validating factory. Holding a `Safe<T>` guarantees it is valid.
 */
type Safe<T> = DeepReadonly<T> & {
    readonly [valid]: true;
};

/** A single validation failure: where it occurred and why. */
interface ValidationError {
    /** Dotted path to the invalid field, e.g. `'transaction.supplier.country'`. */
    path: string;
    /** Human-readable reason the field is invalid. */
    message: string;
}

/**
 * A property set on a party or object: a name and its positional arguments.
 *
 * The `type` names and the shape of `args` each property expects are defined by the API and
 * can be discovered from the `/property/object` and `/property/party` endpoints.
 */
interface AnalysisProperty {
    /** The property's name, e.g. `'location'` or `'deduction_regime'`. */
    type: string;
    /** Positional arguments for the property, matching what that property expects. */
    args: (string | number | boolean)[];
}
/** Transport of an object. */
interface Transport {
    /** Country the object is transported from. */
    from: Country;
    /** Country the object is transported to. */
    to: Country;
    /** Who carries out the transport. */
    by: TransportBy;
    /** Whether documentary proof of transport is available. */
    proof_of_transport: boolean;
}
/** A party to the transaction: the supplier or the receiver. */
interface Party {
    /** The party's role or status. */
    type: PartyType;
    /** The party's VAT identifier, if any. Omit or leave empty when the party has none. */
    vat_number?: string;
    /** Country the party is established in. */
    country: Country;
    /** Optional properties qualifying the party. */
    properties: AnalysisProperty[];
}
/** The good or service being transacted. */
interface AnalysisObject {
    /** The object's category. */
    type: ObjectType;
    /** Optional properties qualifying the object. */
    properties: AnalysisProperty[];
    /** Transport details, present when the object moves between countries. */
    transport?: Transport;
}
/** The transaction to analyse. */
interface VatmiraalAnalysisInput {
    /** Date the taxable event occurs, as `YYYY-MM-DD`. */
    taxable_point: string;
    /** The kind of transaction. */
    type: TransactionType;
    /** Net amount subject to VAT, excluding VAT itself. Must be `>= 0`. */
    taxable_amount: number;
    /** VAT amount charged on the transaction. Must be `>= 0`. */
    vat_amount: number;
    /** The party supplying the good or service. */
    supplier: Party;
    /** The party receiving the good or service. */
    receiver: Party;
    /** The good or service being transacted. */
    object: AnalysisObject;
}
/** Which party of the transaction the analysis is run for. */
type Perspective = 'supplier' | 'receiver';
/** A transaction to analyse, together with the party it is analysed for. */
interface TaxGridAnalysisRequest {
    /** The transaction to analyse. */
    transaction: VatmiraalAnalysisInput;
    /** Which party the analysis is run for. */
    perspective: Perspective;
}

/** The broad grouping an object category belongs to. */
interface BroadCategoryRef {
    value: string;
    label: string;
}
/** An object category and the taxonomy around it: its broad grouping, the
 * transaction types it applies to, and the object properties it accepts. */
interface ObjectCategory {
    value: string;
    label: string;
    broad_category: BroadCategoryRef;
    transaction_types: TransactionType[];
    description: string;
    /** The object properties this category accepts. `null` when it accepts none. */
    properties: string[] | null;
}
/** A broad category together with every object category that belongs to it. */
interface BroadCategoryDetail {
    value: string;
    label: string;
    categories: ObjectCategory[];
}
/** A country equivalence class and the countries that fall under it. */
interface CountryClass {
    /** The class name, e.g. `belgium`, `other_eu`, or `third_country`. */
    class: string;
    countries: Country[];
}
/**
 * One argument a property expects. `domain` is the kind of value it takes: `oneof` (choose
 * from `values`), `int` (bounded by `min`/`max`), `country`, `rate` (an integer from 0 to 100),
 * `atom` (free-form string), or `type_name` (a reusable named type, given by `type_name`).
 */
interface PropertyArg {
    name: string;
    domain: string;
    /** The reusable named type, when `domain` is `type_name`. */
    type_name?: string;
    /** Allowed values, when `domain` is `oneof`. */
    values?: string[];
    /** Lower bound, when `domain` is `int`. */
    min?: number;
    /** Upper bound, when `domain` is `int`. */
    max?: number;
}
/** An available object or party property and the arguments it expects. */
interface PropertySpec {
    value: string;
    label: string;
    args: PropertyArg[];
}
/** The full domain vocabulary, loaded once. */
interface VatSchema {
    transactionTypes: TransactionType[];
    partyTypes: PartyType[];
    transportBy: TransportBy[];
    countries: Country[];
    categories: ObjectCategory[];
    objectProperties: PropertySpec[];
    partyProperties: PropertySpec[];
}

/** Validate a transport against the schema; returns the validated transport or the failures. */
declare function transport(input: Transport, schema: VatSchema): Result<Safe<Transport>, ValidationError[]>;
/** A boolean-guard form of {@link transport}; narrows `input` to `Safe<Transport>`. */
declare function isSafeTransport(input: DeepReadonly<Transport>, schema: VatSchema): input is Safe<Transport>;

/** Validate a party against the schema; returns the validated party or the failures. */
declare function party(input: Party, schema: VatSchema): Result<Safe<Party>, ValidationError[]>;
/** A boolean-guard form of {@link party}; narrows `input` to `Safe<Party>` when valid. */
declare function isSafeParty(input: DeepReadonly<Party>, schema: VatSchema): input is Safe<Party>;

/** Validate an object against the schema; returns the validated object or the failures. */
declare function analysisObject(input: AnalysisObject, schema: VatSchema): Result<Safe<AnalysisObject>, ValidationError[]>;
/** A boolean-guard form of {@link analysisObject}; narrows `input` when valid. */
declare function isSafeAnalysisObject(input: DeepReadonly<AnalysisObject>, schema: VatSchema): input is Safe<AnalysisObject>;

/** Validate a transaction against the schema; returns the validated transaction or the failures. */
declare function transaction(input: VatmiraalAnalysisInput, schema: VatSchema): Result<Safe<VatmiraalAnalysisInput>, ValidationError[]>;
/** A boolean-guard form of {@link transaction}; narrows `input` when valid. */
declare function isSafeTransaction(input: DeepReadonly<VatmiraalAnalysisInput>, schema: VatSchema): input is Safe<VatmiraalAnalysisInput>;

/** Validate a full tax-grid analysis request; returns the validated request or the failures. */
declare function taxGridAnalysisRequest(input: TaxGridAnalysisRequest, schema: VatSchema): Result<Safe<TaxGridAnalysisRequest>, ValidationError[]>;
/** A boolean-guard form of {@link taxGridAnalysisRequest}; narrows `input` when valid. */
declare function isSafeTaxGridAnalysisRequest(input: DeepReadonly<TaxGridAnalysisRequest>, schema: VatSchema): input is Safe<TaxGridAnalysisRequest>;

/** A citation for a grid determination: a structured legal reference, a bare code, or none. */
type LegalReference = {
    article: string;
    paragraph: string;
    section: string;
    subsection: string;
    book: string;
} | {
    code: string;
} | {
    no_basis: true;
};
/** A party a justification is scoped to, for a `debtor` context. */
interface JustificationParty {
    type: string;
    vat_number?: string;
    country: string;
}
/** Scope a justification is limited to, when applicable. */
interface JustificationContext {
    type: 'place' | 'debtor' | 'does_not_apply';
    location?: string;
    party?: JustificationParty;
}
/** One legal ground for a grid determination. */
interface Justification {
    legal_reference: LegalReference;
    context?: JustificationContext;
    justification: string;
    applies: boolean;
}
interface TaxGridResult {
    grid: string;
    amount: number;
    justifications: Justification[];
}
/** An issue raised about the transaction (a warning or an inconsistency). */
interface Warning {
    type: string;
    data: Record<string, unknown>;
    justification: string;
}
/**
 * The tax-grid-analysis result, distinguished by `status`. A `consistent` result carries the
 * grids the transaction maps to; an `inconsistent` result carries the inconsistencies that
 * halted the analysis, with no grids. Both carry any warnings raised about the transaction.
 */
type TaxGridAnalysisResponse = {
    status: 'consistent';
    grids: TaxGridResult[];
    warnings: Warning[];
} | {
    status: 'inconsistent';
    inconsistencies: Warning[];
    warnings: Warning[];
};

/**
 * Analyse a transaction and get the tax grids it maps to, along with any warnings and
 * inconsistencies raised about it. Accepts a plain request or a validated `Safe<...>` one.
 */
declare function analyzeTaxGrid(client: Client, request: DeepReadonly<TaxGridAnalysisRequest>): SafePromise<TaxGridAnalysisResponse, Error>;

declare function isLegalReference(value: unknown): value is LegalReference;
declare function isJustificationContext(value: unknown): value is JustificationContext;
declare function isJustification(value: unknown): value is Justification;
declare function isTaxGridResult(value: unknown): value is TaxGridResult;
declare function isWarning(value: unknown): value is Warning;
declare function isTaxGridAnalysisResponse(value: unknown): value is TaxGridAnalysisResponse;

/** Fetch the transaction types the analysis recognises. */
declare function fetchTransactionTypes(client: Client): SafePromise<TransactionType[], Error>;
/** Fetch the party types a transaction can involve. */
declare function fetchPartyTypes(client: Client): SafePromise<PartyType[], Error>;
/** Fetch the transport methods. */
declare function fetchTransportBy(client: Client): SafePromise<TransportBy[], Error>;
/** Fetch the countries the VAT rules recognise. */
declare function fetchCountries(client: Client): SafePromise<Country[], Error>;
/** Fetch the object categories and the taxonomy around them. */
declare function fetchCategories(client: Client): SafePromise<ObjectCategory[], Error>;
/** Fetch a single object category by its value. */
declare function fetchCategory(client: Client, value: string): SafePromise<ObjectCategory, Error>;
/** Fetch the broad categories object categories are grouped under. */
declare function fetchBroadCategories(client: Client): SafePromise<BroadCategoryRef[], Error>;
/** Fetch a single broad category and every object category that belongs to it. */
declare function fetchBroadCategory(client: Client, value: string): SafePromise<BroadCategoryDetail, Error>;
/** Fetch the specs of the properties an object can carry. */
declare function fetchObjectProperties(client: Client): SafePromise<PropertySpec[], Error>;
/** Fetch the spec of a single object property by its value. */
declare function fetchObjectProperty(client: Client, value: string): SafePromise<PropertySpec, Error>;
/** Fetch the specs of the properties a party can carry. */
declare function fetchPartyProperties(client: Client): SafePromise<PropertySpec[], Error>;
/** Fetch the spec of a single party property by its value. */
declare function fetchPartyProperty(client: Client, value: string): SafePromise<PropertySpec, Error>;
/** Fetch the country equivalence classes and the countries under each. */
declare function fetchCountryClasses(client: Client): SafePromise<CountryClass[], Error>;
/**
 * Fetch the whole domain vocabulary at once, as a single {@link VatSchema}. Runs the
 * individual fetches in parallel and fails with the first one that errors.
 */
declare function fetchSchema(client: Client): SafePromise<VatSchema, Error>;

declare function isBroadCategoryRef(value: unknown): value is BroadCategoryRef;
declare function isObjectCategory(value: unknown): value is ObjectCategory;
declare function isPropertyArg(value: unknown): value is PropertyArg;
declare function isPropertySpec(value: unknown): value is PropertySpec;
declare function isObjectCategoryArray(value: unknown): value is ObjectCategory[];
declare function isBroadCategoryRefArray(value: unknown): value is BroadCategoryRef[];
declare function isBroadCategoryDetail(value: unknown): value is BroadCategoryDetail;
declare function isCountryClass(value: unknown): value is CountryClass;
declare function isCountryClassArray(value: unknown): value is CountryClass[];
declare function isPropertySpecArray(value: unknown): value is PropertySpec[];

/** A request to validate a VAT number. */
interface VatValidationInput {
    /** The VAT number to validate. */
    vat: string;
    /** Validate against the country format template only, rather than a registry lookup. */
    template_validation?: boolean;
}
/** The outcome of validating a VAT number. */
interface VatValidationOutput {
    /** Whether the VAT number is valid. */
    valid: boolean;
    /** Whether the number was validated against a format template. */
    template_validated?: boolean;
    /** The reasons the number was found invalid, when it is not valid. */
    invalid_context?: string[];
}
/** The expected VAT number format for a country. */
interface VatTemplate {
    /** The country the template applies to. */
    country: Country;
    /** Two-letter VAT country code. */
    country_code: string;
    /** Expected VAT number format. */
    template: string;
}

/** Validate a VAT number, optionally against the country format template only. */
declare function validateVat(client: Client, input: VatValidationInput): SafePromise<VatValidationOutput, Error>;
/** Fetch the VAT number format templates for every country. */
declare function fetchVatTemplates(client: Client): SafePromise<VatTemplate[], Error>;
/** Fetch the VAT number format template for one country. */
declare function fetchVatTemplate(client: Client, country: Country): SafePromise<VatTemplate, Error>;

/** True when `value` is a well-formed {@link VatValidationOutput}. */
declare function isVatValidationOutput(value: unknown): value is VatValidationOutput;
/** True when `value` is a well-formed {@link VatTemplate}. */
declare function isVatTemplate(value: unknown): value is VatTemplate;
/** True when `value` is an array of {@link VatTemplate}. */
declare function isVatTemplateArray(value: unknown): value is VatTemplate[];

/** A free-text description to infer a structured object from. */
interface InferenceRequest {
    /** Free-text description of the object, e.g. `'consulting services'`. */
    description: string;
}
/** A property mentioned in a description whose name or arguments are not recognised. */
interface RawProperty {
    type: string;
    args?: (string | number | boolean)[];
}
/** A candidate object type inferred from a description. */
interface Candidate {
    /** The inferred object type, or `'unknown'`. */
    type: ObjectType;
    /** Transaction types the inferred type is compatible with. */
    transaction_types: TransactionType[];
    /** Recognised properties found in the description. */
    properties: AnalysisProperty[];
    /** Required properties of the type not stated in the description. */
    missing_properties: string[];
    /** Attributes found that are not known properties of the type. */
    extra: RawProperty[];
    /** Known properties whose argument is outside the accepted domain. */
    invalid: RawProperty[];
    /** Reasoning specific to this candidate. */
    comment: string;
}
/** The inferred object candidates for a description, most likely first. */
interface InferenceResult {
    candidates: Candidate[];
}

/** Infer candidate structured objects from a free-text description. */
declare function inferObject(client: Client, description: string): SafePromise<InferenceResult, Error>;

/** True when `value` is a well-formed {@link InferenceResult}. */
declare function isInferenceResult(value: unknown): value is InferenceResult;

/**
 * A groundable audit dimension. Provide a value to fix (ground) it, an `{ options }` object to
 * narrow it to a set, or `null` to leave it open for the search to vary.
 */
type Field<T> = T | {
    options: T[];
} | null;
/** A tax grid and the amount the audit should target on it. */
interface TargetGrid {
    grid: string;
    amount: number;
}
/**
 * Narrow or exclude a property across the audit search. `options` lists the argument tuples to
 * try, `samples` seeds specific argument values, and `exclude` drops the property entirely.
 */
interface PropertyOverride {
    name: string;
    options?: unknown[][];
    samples?: Record<string, number[]>;
    exclude?: boolean;
}
/**
 * A supplier or receiver in an audit request. Each groundable dimension may be a fixed value, an
 * `{ options }` narrowing, `null`, or omitted entirely — omitting it leaves it open for the search.
 */
interface AuditParty {
    type?: Field<PartyType>;
    vat_number: string;
    country?: Field<Country>;
    properties?: PropertyOverride[];
}
/**
 * The goods movement of an audited delivery, from which its place of supply is derived. Each field
 * may be pinned or omitted to leave it open for the search — grounding the route reaches
 * cross-border grids (intra-community supply, export). Only applies to a delivery; omitting the
 * whole `transport` searches the movement itself (no transport for a domestic supply, or a route).
 */
interface AuditTransport {
    from?: Country;
    to?: Country;
    by?: TransportBy;
    proof_of_transport?: boolean;
}
/**
 * The transacted object in an audit request. Each groundable dimension may be a fixed value, an
 * `{ options }` narrowing, `null`, or omitted entirely — omitting it leaves it open for the search.
 */
interface AuditObject {
    type?: Field<ObjectType>;
    /**
     * The object's location, as a country equivalence class name (e.g. `belgium`, `other_eu`). It
     * drives the place of supply for services connected to immovable property, events, and energy; a
     * goods movement's place of supply comes from {@link AuditTransport} instead.
     */
    location?: Field<string>;
    properties?: PropertyOverride[];
    /** Goods movement for a delivery; grounding it reaches cross-border grids. Ignored for services. */
    transport?: AuditTransport;
}
/** A request to audit the input scenarios that produce a set of target grids. */
interface AuditRequest {
    target: TargetGrid[];
    /** Date the taxable event occurs, as `YYYY-MM-DD`. */
    taxable_point: string;
    taxable_amount: number;
    vat_amount: number;
    supplier: AuditParty;
    receiver: AuditParty;
    object: AuditObject;
    perspective?: Perspective;
    /** Maximum number of scenarios to return. */
    limit?: number;
}
/** A numeric range an audit argument can take, from clp(fd) constraints. */
interface NumericRange {
    min: unknown;
    max: unknown;
}
/** One argument of an audit property: a scalar value or a numeric range. */
type AuditArg = string | number | boolean | null | NumericRange;
/** A property set on a party or object in an audit scenario. */
interface AuditProperty {
    type: string;
    args: AuditArg[];
}
/** One scenario the audit found that produces the target grids. */
interface AuditScenario {
    supplier_type: string;
    /** The supplier's country equivalence class. */
    supplier_country: string;
    receiver_type: string;
    /** The receiver's country equivalence class. */
    receiver_country: string;
    transaction_type: string;
    supplier_properties: AuditProperty[];
    customer_properties: AuditProperty[];
    object_properties: AuditProperty[];
    grids: TaxGridResult[];
}
/** The terminal line of an audit stream, describing how the search ended. */
interface AuditTrailer {
    done: boolean;
    count: number;
    truncated: boolean;
    /** Why the search stopped, e.g. `complete`, `timeout`, or `limit`. */
    reason: string;
}
/** One dimension of the audit input model and how it can be grounded. */
interface AuditDimension {
    field: string;
    label: string;
    mode: string;
    control: string;
    /** URL of the route that lists this dimension's values, when discovered remotely. */
    values_from?: string;
    /** Inline fixed set of values, when not discovered remotely. */
    values?: string[];
    /** URL of the country-class expansion route, for place-of-supply dimensions. */
    classes_from?: string;
    description?: string;
}
/** A descriptor of the audit input model: how to ground its dimensions. */
interface AuditCapabilities {
    response_type: string;
    conventions: Record<string, string>;
    dimensions: AuditDimension[];
}

/** Fetch the descriptor of the audit input model: its dimensions and how to ground them. */
declare function fetchAuditCapabilities(client: Client): SafePromise<AuditCapabilities, Error>;
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
 * Pass an `AbortSignal` to stop the search early: aborting closes the streaming connection, which
 * the server observes to cancel the (single-threaded, expensive) engine query rather than letting
 * it run to its wall-clock cap. An aborted read surfaces as the generator throwing `AbortError`.
 *
 * The generator throws if the service reports an engine error mid-stream, if a streamed line is
 * neither a scenario nor the trailer, or if the stream ends without a trailer.
 */
declare function auditScenarios(client: Client, request: AuditRequest, options?: {
    signal?: AbortSignal;
}): SafePromise<AsyncGenerator<AuditScenario, AuditTrailer, void>, Error>;

declare function isNumericRange(value: unknown): value is NumericRange;
declare function isAuditArg(value: unknown): value is AuditArg;
declare function isAuditProperty(value: unknown): value is AuditProperty;
declare function isAuditScenario(value: unknown): value is AuditScenario;
declare function isAuditTrailer(value: unknown): value is AuditTrailer;
declare function isAuditDimension(value: unknown): value is AuditDimension;
declare function isAuditCapabilities(value: unknown): value is AuditCapabilities;

/** Credentials to exchange for a session at `/auth/login`. */
interface LoginInput {
    /** The OAuth ID token (e.g. a Google ID token) to verify. */
    id_token: string;
}
/** The identity of the authenticated user. */
interface AuthIdentity {
    name: string;
    email: string;
}

/**
 * Verify an OAuth ID token and open a session, returning the authenticated identity. The session
 * cookie the service sets is only stored and resent when the client is built with
 * `credentials: 'include'` (an `OAuthOptions` client).
 */
declare function login(client: Client, input: LoginInput): SafePromise<AuthIdentity, Error>;
/**
 * Fetch the identity the current session belongs to. Requires a client built with
 * `credentials: 'include'` so the session cookie is sent.
 */
declare function fetchIdentity(client: Client): SafePromise<AuthIdentity, Error>;
/** Clear the current session. Resolves to `true` on success. */
declare function logout(client: Client): SafePromise<boolean, Error>;

declare function isAuthIdentity(value: unknown): value is AuthIdentity;

export { type AnalysisObject, type AnalysisProperty, ApiError, type ApiErrorBody, type AuditArg, type AuditCapabilities, type AuditDimension, type AuditObject, type AuditParty, type AuditProperty, type AuditRequest, type AuditScenario, type AuditTrailer, type AuditTransport, type AuthIdentity, type BroadCategoryDetail, type BroadCategoryRef, type Candidate, type Client, type Country, type CountryClass, DEFAULT_BASE_URL, type DeepReadonly, type Field, type InferenceRequest, type InferenceResult, type Justification, type JustificationContext, type JustificationParty, type LegalReference, type LoginInput, type NumericRange, type OAuthOptions, type ObjectCategory, type ObjectType, type Party, type PartyType, type Perspective, type PropertyArg, type PropertyOverride, type PropertySpec, type RawProperty, type Safe, type TargetGrid, type TaxGridAnalysisRequest, type TaxGridAnalysisResponse, type TaxGridResult, type TokenOptions, type TransactionType, type Transport, type TransportBy, type ValidationError, type VatSchema, type VatTemplate, type VatValidationInput, type VatValidationOutput, type VatmiraalAnalysisInput, VatmiraalClient, type VatmiraalClientOptions, type Warning, analysisObject, analyzeTaxGrid, apiErrorFromResponse, auditScenarios, fetchAuditCapabilities, fetchBroadCategories, fetchBroadCategory, fetchCategories, fetchCategory, fetchCountries, fetchCountryClasses, fetchIdentity, fetchObjectProperties, fetchObjectProperty, fetchPartyProperties, fetchPartyProperty, fetchPartyTypes, fetchSchema, fetchTransactionTypes, fetchTransportBy, fetchVatTemplate, fetchVatTemplates, inferObject, isApiErrorBody, isAuditArg, isAuditCapabilities, isAuditDimension, isAuditProperty, isAuditScenario, isAuditTrailer, isAuthIdentity, isBroadCategoryDetail, isBroadCategoryRef, isBroadCategoryRefArray, isCountryClass, isCountryClassArray, isInferenceResult, isJustification, isJustificationContext, isLegalReference, isNumericRange, isObjectCategory, isObjectCategoryArray, isPropertyArg, isPropertySpec, isPropertySpecArray, isSafeAnalysisObject, isSafeParty, isSafeTaxGridAnalysisRequest, isSafeTransaction, isSafeTransport, isTaxGridAnalysisResponse, isTaxGridResult, isVatTemplate, isVatTemplateArray, isVatValidationOutput, isWarning, login, logout, party, ping, streamLines, taxGridAnalysisRequest, transaction, transport, validateVat };
