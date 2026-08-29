import { result, error, safePromise, isError, type SafePromise } from 'result-interface';
import type { Client } from '../client/types';
import { requestJson } from '../client/json';
import { toError } from '../common/to-error';
import type { Country, PartyType, TransactionType, TransportBy } from '../common/domain-types';
import type { ObjectCategory, PropertySpec, VatSchema } from './schema-types';
import { isObjectCategoryArray, isPropertySpecArray, isStringArray } from './schema-guards';

/** Fetch the transaction types the analysis recognises. */
export function fetchTransactionTypes(client: Client): SafePromise<TransactionType[], Error> {
	return requestJson(client, '/transaction-type', isStringArray);
}

/** Fetch the party types a transaction can involve. */
export function fetchPartyTypes(client: Client): SafePromise<PartyType[], Error> {
	return requestJson(client, '/party-type', isStringArray);
}

/** Fetch the transport methods. */
export function fetchTransportBy(client: Client): SafePromise<TransportBy[], Error> {
	return requestJson(client, '/transport-by', isStringArray);
}

/** Fetch the countries the VAT rules recognise. */
export function fetchCountries(client: Client): SafePromise<Country[], Error> {
	return requestJson(client, '/country', isStringArray);
}

/** Fetch the object categories and the taxonomy around them. */
export function fetchCategories(client: Client): SafePromise<ObjectCategory[], Error> {
	return requestJson(client, '/category', isObjectCategoryArray);
}

/** Fetch the specs of the properties an object can carry. */
export function fetchObjectProperties(client: Client): SafePromise<PropertySpec[], Error> {
	return requestJson(client, '/property/object', isPropertySpecArray);
}

/** Fetch the specs of the properties a party can carry. */
export function fetchPartyProperties(client: Client): SafePromise<PropertySpec[], Error> {
	return requestJson(client, '/property/party', isPropertySpecArray);
}

/**
 * Fetch the whole domain vocabulary at once, as a single {@link VatSchema}. Runs the
 * individual fetches in parallel and fails with the first one that errors.
 */
export async function fetchSchema(client: Client): SafePromise<VatSchema, Error> {
	const all = await safePromise(
		Promise.all([
			fetchTransactionTypes(client),
			fetchPartyTypes(client),
			fetchTransportBy(client),
			fetchCountries(client),
			fetchCategories(client),
			fetchObjectProperties(client),
			fetchPartyProperties(client)
		])
	);
	if (isError(all)) {
		return error(toError(all.error));
	}
	const [
		transactionTypes,
		partyTypes,
		transportBy,
		countries,
		categories,
		objectProperties,
		partyProperties
	] = all.value;

	if (isError(transactionTypes)) {
		return transactionTypes;
	}
	if (isError(partyTypes)) {
		return partyTypes;
	}
	if (isError(transportBy)) {
		return transportBy;
	}
	if (isError(countries)) {
		return countries;
	}
	if (isError(categories)) {
		return categories;
	}
	if (isError(objectProperties)) {
		return objectProperties;
	}
	if (isError(partyProperties)) {
		return partyProperties;
	}

	return result({
		transactionTypes: transactionTypes.value,
		partyTypes: partyTypes.value,
		transportBy: transportBy.value,
		countries: countries.value,
		categories: categories.value,
		objectProperties: objectProperties.value,
		partyProperties: partyProperties.value
	});
}
