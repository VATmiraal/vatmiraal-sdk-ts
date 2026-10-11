import { isRecord, isStringArray } from '../common/guards';
import type {
	BroadCategoryDetail,
	BroadCategoryRef,
	ObjectCategory,
	PropertyArg,
	PropertySpec
} from './schema-types';

export function isBroadCategoryRef(value: unknown): value is BroadCategoryRef {
	return isRecord(value) && typeof value.value === 'string' && typeof value.label === 'string';
}

export function isObjectCategory(value: unknown): value is ObjectCategory {
	return (
		isRecord(value) &&
		typeof value.value === 'string' &&
		typeof value.label === 'string' &&
		isBroadCategoryRef(value.broad_category) &&
		isStringArray(value.transaction_types) &&
		typeof value.description === 'string' &&
		isStringArray(value.properties)
	);
}

export function isPropertyArg(value: unknown): value is PropertyArg {
	return (
		isRecord(value) &&
		typeof value.name === 'string' &&
		typeof value.domain === 'string' &&
		(value.type_name === undefined || typeof value.type_name === 'string') &&
		(value.values === undefined || isStringArray(value.values)) &&
		(value.min === undefined || typeof value.min === 'number') &&
		(value.max === undefined || typeof value.max === 'number')
	);
}

export function isPropertySpec(value: unknown): value is PropertySpec {
	return (
		isRecord(value) &&
		typeof value.value === 'string' &&
		typeof value.label === 'string' &&
		Array.isArray(value.args) &&
		value.args.every(isPropertyArg)
	);
}

export function isObjectCategoryArray(value: unknown): value is ObjectCategory[] {
	return Array.isArray(value) && value.every(isObjectCategory);
}

export function isBroadCategoryRefArray(value: unknown): value is BroadCategoryRef[] {
	return Array.isArray(value) && value.every(isBroadCategoryRef);
}

export function isBroadCategoryDetail(value: unknown): value is BroadCategoryDetail {
	return (
		isRecord(value) &&
		typeof value.value === 'string' &&
		typeof value.label === 'string' &&
		isObjectCategoryArray(value.categories)
	);
}

export function isPropertySpecArray(value: unknown): value is PropertySpec[] {
	return Array.isArray(value) && value.every(isPropertySpec);
}
