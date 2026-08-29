/** A citation for a grid determination: a structured legal reference, a bare code, or none. */
export type LegalReference =
	| {
			article: string;
			paragraph: string;
			section: string;
			subsection: string;
			book: string;
	  }
	| { code: string }
	| { no_basis: true };

/** A party a justification is scoped to, for a `debtor` context. */
export interface JustificationParty {
	type: string;
	vat_number?: string;
	country: string;
}

/** Scope a justification is limited to, when applicable. */
export interface JustificationContext {
	type: 'place' | 'debtor' | 'does_not_apply';
	location?: string;
	party?: JustificationParty;
}

/** One legal ground for a grid determination. */
export interface Justification {
	legal_reference: LegalReference;
	context?: JustificationContext;
	justification: string;
	applies: boolean;
}

export interface TaxGridResult {
	grid: string;
	amount: number;
	justifications: Justification[];
}

/** An issue raised about the transaction (a warning or an inconsistency). */
export interface Warning {
	type: string;
	data: Record<string, unknown>;
	justification: string;
}

/**
 * The tax-grid-analysis result, distinguished by `status`. A `consistent` result carries the
 * grids the transaction maps to; an `inconsistent` result carries the inconsistencies that
 * halted the analysis, with no grids. Both carry any warnings raised about the transaction.
 */
export type TaxGridAnalysisResponse =
	| { status: 'consistent'; grids: TaxGridResult[]; warnings: Warning[] }
	| { status: 'inconsistent'; inconsistencies: Warning[]; warnings: Warning[] };
