import type {
	Country,
	ObjectType,
	PartyType,
	TransactionType,
	TransportBy
} from '../common/domain-types';

/**
 * A property set on a party or object: a name and its positional arguments.
 *
 * The `type` names and the shape of `args` each property expects are defined by the API and
 * can be discovered from the `/property/object` and `/property/party` endpoints.
 */
export interface AnalysisProperty {
	/** The property's name, e.g. `'location'` or `'deduction_regime'`. */
	type: string;
	/** Positional arguments for the property, matching what that property expects. */
	args: (string | number | boolean)[];
}

/** Transport of an object. */
export interface Transport {
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
export interface Party {
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
export interface AnalysisObject {
	/** Free-form label describing the object, e.g. `'consulting'`. */
	classification: string;
	/** The object's category. */
	type: ObjectType;
	/** Optional properties qualifying the object. */
	properties: AnalysisProperty[];
	/** Transport details, present when the object moves between countries. */
	transport?: Transport;
}

/** The transaction to analyse. */
export interface VatmiraalAnalysisInput {
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
export type Perspective = 'supplier' | 'receiver';

/** A transaction to analyse, together with the party it is analysed for. */
export interface TaxGridAnalysisRequest {
	/** The transaction to analyse. */
	transaction: VatmiraalAnalysisInput;
	/** Which party the analysis is run for. */
	perspective: Perspective;
}
