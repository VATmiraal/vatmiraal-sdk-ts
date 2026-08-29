import { describe, it, expect } from 'vitest';
import {
	isJustification,
	isJustificationContext,
	isLegalReference,
	isRecord,
	isTaxGridAnalysisResponse,
	isTaxGridResult,
	isUnknownArray,
	isWarning
} from '../../lib/analysis/tax-grid-output-guards';
import type {
	Justification,
	TaxGridAnalysisResponse,
	TaxGridResult,
	Warning
} from '../../lib/analysis/tax-grid-output-types';

const structuredJustification: Justification = {
	legal_reference: { article: '44', paragraph: '2', section: '1', subsection: 'n/a', book: 'wbtw' },
	context: { type: 'place', location: 'belgium' },
	justification: 'Place of supply is Belgium.',
	applies: true
};

const codeJustification: Justification = {
	legal_reference: { code: 'box_goods' },
	justification: 'Supply of goods.',
	applies: true
};

const taxGrid: TaxGridResult = {
	grid: '81',
	amount: 100,
	justifications: [structuredJustification, codeJustification]
};

const warning: Warning = {
	type: 'missing vat number',
	data: { role: 'receiver' },
	justification: 'A warning.'
};

const consistent: TaxGridAnalysisResponse = {
	status: 'consistent',
	grids: [taxGrid],
	warnings: [warning]
};

const inconsistent: TaxGridAnalysisResponse = {
	status: 'inconsistent',
	inconsistencies: [warning],
	warnings: []
};

describe(isRecord.name, () => {
	it('accepts a plain object', () => {
		expect(isRecord({})).toBe(true);
	});

	it('rejects null and non-objects', () => {
		expect(isRecord(null)).toBe(false);
		expect(isRecord('x')).toBe(false);
		expect(isRecord(3)).toBe(false);
	});
});

describe(isUnknownArray.name, () => {
	it('accepts arrays and rejects non-arrays', () => {
		expect(isUnknownArray([])).toBe(true);
		expect(isUnknownArray({})).toBe(false);
	});
});

describe(isLegalReference.name, () => {
	it('accepts a structured reference', () => {
		expect(
			isLegalReference({ article: '1', paragraph: '2', section: '3', subsection: '4', book: 'b' })
		).toBe(true);
	});

	it('accepts a code reference', () => {
		expect(isLegalReference({ code: 'box_goods' })).toBe(true);
	});

	it('accepts a no-basis reference', () => {
		expect(isLegalReference({ no_basis: true })).toBe(true);
	});

	it('rejects an incomplete structured reference', () => {
		expect(isLegalReference({ article: '1', paragraph: '2' })).toBe(false);
	});

	it('rejects non-objects', () => {
		expect(isLegalReference(null)).toBe(false);
	});
});

describe(isJustificationContext.name, () => {
	it('accepts the three context types', () => {
		expect(isJustificationContext({ type: 'place', location: 'belgium' })).toBe(true);
		expect(isJustificationContext({ type: 'debtor' })).toBe(true);
		expect(isJustificationContext({ type: 'does_not_apply' })).toBe(true);
	});

	it('rejects an unknown type', () => {
		expect(isJustificationContext({ type: 'other' })).toBe(false);
	});
});

describe(isJustification.name, () => {
	it('accepts a well-formed justification', () => {
		expect(isJustification(structuredJustification)).toBe(true);
		expect(isJustification(codeJustification)).toBe(true);
	});

	it('rejects one with a missing legal reference', () => {
		expect(isJustification({ justification: 'x', applies: true })).toBe(false);
	});

	it('rejects one with a non-boolean applies', () => {
		expect(
			isJustification({ legal_reference: { no_basis: true }, justification: 'x', applies: 'yes' })
		).toBe(false);
	});

	it('rejects one with a malformed context', () => {
		expect(
			isJustification({
				legal_reference: { no_basis: true },
				justification: 'x',
				applies: true,
				context: { type: 'other' }
			})
		).toBe(false);
	});
});

describe(isTaxGridResult.name, () => {
	it('accepts a well-formed grid', () => {
		expect(isTaxGridResult(taxGrid)).toBe(true);
	});

	it('rejects a grid without justifications', () => {
		expect(isTaxGridResult({ grid: '81', amount: 100 })).toBe(false);
	});

	it('rejects a grid with a non-string grid id', () => {
		expect(isTaxGridResult({ grid: 81, amount: 100, justifications: [] })).toBe(false);
	});
});

describe(isWarning.name, () => {
	it('accepts a well-formed warning', () => {
		expect(isWarning(warning)).toBe(true);
	});

	it('rejects one with a missing data map', () => {
		expect(isWarning({ type: 'x', justification: 'y' })).toBe(false);
	});
});

describe(isTaxGridAnalysisResponse.name, () => {
	it('accepts a consistent result', () => {
		expect(isTaxGridAnalysisResponse(consistent)).toBe(true);
	});

	it('accepts an inconsistent result', () => {
		expect(isTaxGridAnalysisResponse(inconsistent)).toBe(true);
	});

	it('rejects a non-object', () => {
		expect(isTaxGridAnalysisResponse(null)).toBe(false);
	});

	it('rejects missing or malformed warnings', () => {
		expect(isTaxGridAnalysisResponse({ status: 'consistent', grids: [] })).toBe(false);
		expect(isTaxGridAnalysisResponse({ status: 'consistent', grids: [], warnings: [{}] })).toBe(
			false
		);
	});

	it('rejects an unknown status', () => {
		expect(isTaxGridAnalysisResponse({ status: 'other', warnings: [] })).toBe(false);
	});

	it('rejects a consistent result with malformed grids', () => {
		expect(isTaxGridAnalysisResponse({ status: 'consistent', warnings: [], grids: 'nope' })).toBe(
			false
		);
		expect(
			isTaxGridAnalysisResponse({ status: 'consistent', warnings: [], grids: [{ grid: '81' }] })
		).toBe(false);
	});

	it('rejects an inconsistent result with malformed inconsistencies', () => {
		expect(
			isTaxGridAnalysisResponse({ status: 'inconsistent', warnings: [], inconsistencies: 'nope' })
		).toBe(false);
		expect(
			isTaxGridAnalysisResponse({
				status: 'inconsistent',
				warnings: [],
				inconsistencies: [{ type: 'x' }]
			})
		).toBe(false);
	});
});
