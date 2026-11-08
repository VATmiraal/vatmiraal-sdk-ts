import type { SafePromise } from 'result-interface';
import type { Client } from '../client/types';
import { requestJson } from '../client/json';
import type {
	CarDeductabilityMethod,
	CarDeductabilityRequest,
	CarDeductabilitySchema,
	CarDeductabilityType,
	CarDeductabilityValue,
	DeductabilityResult
} from './car-deductability-types';
import {
	isCarDeductabilitySchema,
	isCarDeductabilitySchemaMap,
	isCarDeductabilityValueArray,
	isDeductabilityResultArray
} from './car-deductability-guards';

/** Fetch the deductability methods the rules recognise. */
export function fetchCarDeductabilityMethods(
	client: Client
): SafePromise<CarDeductabilityValue[], Error> {
	return requestJson(client, '/deductability/car/schema/method', isCarDeductabilityValueArray);
}

/** Fetch each vehicle type's schema for a method, keyed by type. */
export function fetchCarDeductabilitySchemasByMethod(
	client: Client,
	method: CarDeductabilityMethod
): SafePromise<Record<string, CarDeductabilitySchema>, Error> {
	return requestJson(
		client,
		`/deductability/car/schema/method/${encodeURIComponent(method)}`,
		isCarDeductabilitySchemaMap
	);
}

/** Fetch the vehicle types the rules recognise. */
export function fetchCarDeductabilityTypes(
	client: Client
): SafePromise<CarDeductabilityValue[], Error> {
	return requestJson(client, '/deductability/car/schema/type', isCarDeductabilityValueArray);
}

/** Fetch each method's schema for a vehicle type, keyed by method. */
export function fetchCarDeductabilitySchemasByType(
	client: Client,
	type: CarDeductabilityType
): SafePromise<Record<string, CarDeductabilitySchema>, Error> {
	return requestJson(
		client,
		`/deductability/car/schema/type/${encodeURIComponent(type)}`,
		isCarDeductabilitySchemaMap
	);
}

/** Fetch the schema for a single vehicle type and method. */
export function fetchCarDeductabilitySchema(
	client: Client,
	type: CarDeductabilityType,
	method: CarDeductabilityMethod
): SafePromise<CarDeductabilitySchema, Error> {
	return requestJson(
		client,
		`/deductability/car/schema/${encodeURIComponent(type)}/${encodeURIComponent(method)}`,
		isCarDeductabilitySchema
	);
}

/** Compute a vehicle's deductability for a type, method, and its integer arguments. */
export function computeCarDeductability(
	client: Client,
	input: CarDeductabilityRequest
): SafePromise<DeductabilityResult[], Error> {
	return requestJson(client, '/deductability/car', isDeductabilityResultArray, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(input)
	});
}
