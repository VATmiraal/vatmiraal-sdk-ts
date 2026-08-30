import { $ } from 'bun';

// Generate the OpenAPI types from a source: a live API URL or a local path. Defaults to the
// production API, so the types are generated from what the service actually serves.
//   bun run gen:api                                     # from https://api.vatmiraal.be/openapi.json
//   bun run gen:api http://localhost:8080/openapi.json  # from a running local service
//   bun run gen:api test/fixtures/openapi.json          # from the committed fixture (offline)
const source = Bun.argv[2] ?? 'https://api.vatmiraal.be/openapi.json';

await $`openapi-typescript ${source} -o lib/generated/api.ts`;
