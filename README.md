# @vatmiraal/sdk

TypeScript and JavaScript client for the VATmiraal API.

- Typing that mirrors the API, with runtime type guards for every response.
- A functional API: each operation is a plain function that takes a client.
- Results instead of exceptions, via [`result-interface`](https://www.npmjs.com/package/result-interface).
- Opt-in validation that checks a request against the live schema before it is sent.
- Ships ESM, CommonJS, and a minified browser bundle.

## Installation

Install with any JavaScript package manager:

```bash
npm install @vatmiraal/sdk
# or
yarn add @vatmiraal/sdk
# or
pnpm add @vatmiraal/sdk
# or
bun add @vatmiraal/sdk
```

## Getting started

Create a client, authenticating with an API token or browser credentials (see
[Authentication](#authentication)), then call an operation with it. Every operation resolves to
a `Result`: a value on success, or an `Error` on failure.

```ts
import { VatmiraalClient, ping } from '@vatmiraal/sdk';
import { isError } from 'result-interface';

const client = new VatmiraalClient({ token: 'your-token' });

const alive = await ping(client);
if (isError(alive)) {
	console.error('service unreachable:', alive.error.message);
} else {
	console.log('service alive:', alive.value);
}
```

## Authentication

The client authenticates each request with either a bearer token or browser credentials.

```ts
// Bearer token.
new VatmiraalClient({ token: 'your-token' });

// Cookie or OAuth session, sent with each request.
new VatmiraalClient({ credentials: 'include' });
```

A client's options are fixed once it is created. When a token or session expires, the request
resolves to an `ApiError` with status `401`; apply a refreshed token by creating a new client
with it.

```ts
const client = new VatmiraalClient({ token: rotatedToken });
```

The base URL defaults to the public service and can be overridden with `baseUrl`.

## Reading results

Operations never throw for an expected failure. Each returns a `Result` from `result-interface`;
narrow it with `isError` or `isResult`, or use `unwrap` to throw on error.

```ts
import { isError } from 'result-interface';

const res = await validateVat(client, { vat: 'BE0123456789' });
if (isError(res)) {
	// res.error is an Error; an ApiError when the service reported the problem.
} else {
	// res.value is a VatValidationOutput.
}
```

## Operations

### Tax-grid analysis

Analyse a transaction and receive the VAT grids, their justifications, and any warnings.

```ts
import { analyzeTaxGrid } from '@vatmiraal/sdk';

const res = await analyzeTaxGrid(client, {
	transaction: {
		taxable_point: '2026-01-01',
		type: 'service',
		taxable_amount: 100,
		vat_amount: 21,
		supplier: { type: 'company', country: 'belgium', properties: [] },
		receiver: { type: 'company', country: 'france', properties: [] },
		object: { type: 'general_service', properties: [] }
	},
	perspective: 'supplier'
});
```

### VAT number validation

```ts
import { validateVat, fetchVatTemplates, fetchVatTemplate } from '@vatmiraal/sdk';

await validateVat(client, { vat: 'BE0123456789', template_validation: true });
await fetchVatTemplates(client); // every country's VAT number template
await fetchVatTemplate(client, 'belgium'); // one country's template
```

### Object inference

Turn a free-form description into candidate objects for an analysis.

```ts
import { inferObject } from '@vatmiraal/sdk';

await inferObject(client, 'consulting services');
```

### Schema

Fetch the vocabularies the API validates against: transaction types, party types, transport
methods, countries, object categories, and property specifications.

```ts
import { fetchSchema } from '@vatmiraal/sdk';

const schema = await fetchSchema(client); // one call for the whole schema
```

Individual endpoints (`fetchCountries`, `fetchCategories`, `fetchObjectProperties`, and the
rest) are exported too when only part of the schema is needed.

## Validating a request

The plain request types accept any values, so a request can be built freely. To catch invalid
values before a request is sent, validate it against the schema. A validating factory returns
either a branded, deeply-readonly `Safe` value or the list of failures, each with a dotted path
to the offending field.

```ts
import { fetchSchema, taxGridAnalysisRequest, analyzeTaxGrid } from '@vatmiraal/sdk';
import { isError } from 'result-interface';

const schema = await fetchSchema(client);
if (isError(schema)) throw schema.error;

const checked = taxGridAnalysisRequest(request, schema.value);
if (isError(checked)) {
	// checked.error is a ValidationError[], e.g.
	// [{ path: 'transaction.supplier.country', message: 'must be a known country' }]
} else {
	await analyzeTaxGrid(client, checked.value); // checked.value is Safe<TaxGridAnalysisRequest>
}
```

The parts can be validated on their own with `transaction`, `party`, `analysisObject`, and
`transport`, and each has a matching type guard (`isSafeTaxGridAnalysisRequest`, `isSafeParty`,
and so on).

## Browser

The client runs in any modern browser. For a script tag, load the bundle from a CDN and use the
`Vatmiraal` global.

```html
<script src="https://unpkg.com/@vatmiraal/sdk"></script>
<script>
	const client = new Vatmiraal.VatmiraalClient({ token: 'your-token' });
	Vatmiraal.ping(client).then(console.log);
</script>
```

## Module formats

The package ships an ESM build (`import`), a CommonJS build (`require`), and TypeScript
declarations. The correct build is selected automatically by the `exports` field.

## License

Apache-2.0. Copyright VATmiraal LLC. See [LICENSE](./LICENSE).
