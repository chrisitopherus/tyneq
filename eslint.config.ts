import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
    // Ignore generated / third-party output
    {
        ignores: ["dist/**", "node_modules/**", "docs/**"]
    },

    // Type-aware correctness rules for src/ only (F10).
    //
    // Not applied to tests/**: test fixtures legitimately pass loosely-typed or deliberately
    // invalid values (`as any`, wrong-typed arguments) to exercise validation and error paths -
    // an assessment before adoption found ~527 resulting violations there, almost all of them
    // exactly this pattern, not real bugs. Extending type-aware rules to tests/ needs its own
    // per-file review, tracked in tasks/future.md.
    ...tseslint.configs.recommendedTypeChecked.map((config) => ({
        ...config,
        files: ["src/**/*.ts"]
    })),
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            // The codebase's existing convention: prefix an intentionally-unused identifier
            // with `_` (decorator context parameters TC39 requires in the signature, type
            // parameters used only for documentation/variance, discarded destructured values).
            // recommendedTypeChecked's no-unused-vars does not honor this by default.
            "@typescript-eslint/no-unused-vars": [
                "error",
                { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
            ]
        }
    },

    // Coding-style rules for source and tests
    {
        files: ["src/**/*.ts", "tests/**/*.ts"],
        plugins: {
            "@typescript-eslint": tseslint.plugin
        },
        languageOptions: {
            parser: tseslint.parser
        },
        rules: {
            // --- Quotes ---
            // Use double quotes everywhere. Single quotes are allowed only when
            // the string already contains a double quote (avoidEscape).
            "quotes": ["error", "double", { "avoidEscape": true }],

            // --- Semicolons ---
            "semi": ["error", "always"],

            // --- Equality ---
            // Always use === / !== — never loose == / !=.
            "eqeqeq": ["error", "always"],

            // --- Variable declarations ---
            // Forbid var; use const or let.
            "no-var": "error",
            // Use const whenever a variable is never reassigned.
            "prefer-const": "error",

            // --- Arrow functions ---
            // Always parenthesize arrow-function parameters: (x) => x, not x => x.
            "arrow-parens": ["error", "always"],

            // --- Object / array spacing ---
            // Spaces inside object literal braces: { key: value }, not {key: value}.
            "object-curly-spacing": ["error", "always"],

            // --- Whitespace hygiene ---
            // No more than one consecutive blank line, and none at the start/end of a file.
            "no-multiple-empty-lines": ["error", { "max": 1, "maxBOF": 0, "maxEOF": 0 }],
            // No trailing whitespace, including on otherwise-blank indented lines.
            "no-trailing-spaces": "error",

            // --- Explicit access modifiers ---
            // All class members must declare public/private/protected explicitly.
            // Constructors are exempt so private constructor() { } stays concise.
            "@typescript-eslint/explicit-member-accessibility": [
                "error",
                {
                    "accessibility": "explicit"
                }
            ],

            // --- Naming conventions ---
            // Private instance fields: underscore prefix allowed.
            // Private static fields: underscore prefix allowed (conventional for static singletons).
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    "selector": "classProperty",
                    "modifiers": ["private"],
                    "format": ["camelCase"],
                    "leadingUnderscore": "allow"
                },
                {
                    "selector": "classProperty",
                    "modifiers": ["private", "static"],
                    "format": ["camelCase"],
                    "leadingUnderscore": "allow"
                }
            ],

            // Blank lines after block statements:
            // require a blank line after if/for/while/do/switch/try blocks.
            // Two consecutive block statements may follow each other without a blank line.
            "padding-line-between-statements": [
                "error",
                { "blankLine": "always", "prev": ["if", "for", "while", "do", "switch", "try"], "next": "*" },
                { "blankLine": "any",    "prev": ["if", "for", "while", "do", "switch", "try"], "next": ["if", "for", "while", "do", "switch", "try"] }
            ]
        }
    }
);
