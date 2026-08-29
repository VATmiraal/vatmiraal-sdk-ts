import { describe, it, expect } from 'vitest';
import {
	OPERATIONS,
	vatTemplatePath,
	PATH_VAT_TEMPLATE_BY_COUNTRY
} from '../../lib/client/endpoints';

describe('OPERATIONS', () => {
	it('lists each endpoint once, in OpenAPI template form', () => {
		const keys = OPERATIONS.map((o) => `${o.method} ${o.path}`);
		expect(new Set(keys).size).toBe(keys.length);
		for (const { path } of OPERATIONS) {
			expect(path).not.toContain('%');
		}
	});
});

describe(vatTemplatePath.name, () => {
	it('url-encodes the country and lines up with the manifest template', () => {
		expect(vatTemplatePath('be lgium')).toBe('/vat-template/be%20lgium');
		expect(PATH_VAT_TEMPLATE_BY_COUNTRY).toBe('/vat-template/{country}');
	});
});
