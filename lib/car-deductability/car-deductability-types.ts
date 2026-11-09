import type { LegalReference } from '../analysis';

/** A vehicle type the deductability rules recognise. */
export type CarDeductabilityType = string;

/** A deductability method. */
export type CarDeductabilityMethod = string;

/** One integer argument a method takes, with its inclusive bounds (null when unbounded). */
export interface CarDeductabilityArg {
	name: string;
	lower_bound: number | null;
	upper_bound: number | null;
}

/** The arguments a given vehicle type and method require. */
export interface CarDeductabilitySchema {
	type: CarDeductabilityType;
	method: CarDeductabilityMethod;
	args: CarDeductabilityArg[];
}

/** A single value in a list of recognised types or methods. */
export interface CarDeductabilityValue {
	value: string;
}

/** A deductability computation request: the arguments are keyed by their schema name. */
export interface CarDeductabilityRequest {
	type: CarDeductabilityType;
	method: CarDeductabilityMethod;
	args: Record<string, number>;
}

/** Computed deductability outcome. */
export type DeductabilityResult =
	| {
			not_applicable: false;
			percentage: number;
			legal_reference: LegalReference;
	  }
	| { not_applicable: true };
