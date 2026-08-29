import type { TaxGridAnalysisRequest } from '../../../lib/analysis/tax-grid-input-types';
import type { VatSchema } from '../../../lib/schema/schema-types';

/** A minimal but complete schema the `safe` factories can validate against. */
export const schema: VatSchema = {
	transactionTypes: ['service'],
	partyTypes: ['company'],
	transportBy: ['transport_by_seller'],
	countries: ['belgium', 'france'],
	categories: [
		{
			value: 'general_service',
			label: 'General service',
			broad_category: { value: 'services', label: 'Services' },
			transaction_types: ['service'],
			description: 'A general service.',
			properties: []
		}
	],
	objectProperties: [],
	partyProperties: []
};

/** A fresh, fully-valid request against {@link schema} on every call. */
export function validRequest(): TaxGridAnalysisRequest {
	return {
		transaction: {
			taxable_point: '2026-01-01',
			type: 'service',
			taxable_amount: 100,
			vat_amount: 21,
			supplier: { type: 'company', country: 'belgium', properties: [] },
			receiver: { type: 'company', country: 'france', properties: [] },
			object: {
				classification: 'consulting',
				type: 'general_service',
				properties: [],
				transport: {
					from: 'belgium',
					to: 'france',
					by: 'transport_by_seller',
					proof_of_transport: true
				}
			}
		},
		perspective: 'supplier'
	};
}
