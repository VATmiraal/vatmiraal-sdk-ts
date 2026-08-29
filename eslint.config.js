import js from '@eslint/js';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default ts.config(
	{ ignores: ['dist/', 'docs/', 'coverage/', 'lib/generated/', 'node_modules/'] },
	js.configs.recommended,
	ts.configs.recommended,
	prettier,
	{
		rules: {
			// The TypeScript compiler already checks references; this rule misfires on TS globals.
			'no-undef': 'off',
			// Allow intentionally-unused args/vars prefixed with `_`.
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	}
);
