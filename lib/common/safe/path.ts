/**
 * Build a dotted field path under `path`. At the root (`path === ''`) the field stands alone;
 * nested, it is prefixed, e.g. `scoped('transaction')('supplier')` is `'transaction.supplier'`.
 */
export function scoped(path: string): (field: string) => string {
	return (field) => (path === '' ? field : `${path}.${field}`);
}
