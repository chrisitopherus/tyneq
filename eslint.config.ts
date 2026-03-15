import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
    // Ignore generated / third-party output
    {
        ignores: ["dist/**", "node_modules/**", "docs/**"]
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
            // ── Quotes ───────────────────────────────────────────────────────
            // Use double quotes everywhere. Single quotes are allowed only when
            // the string already contains a double quote (avoidEscape).
            "quotes": ["error", "double", { "avoidEscape": true }],

            // ── Semicolons ────────────────────────────────────────────────────
            "semi": ["error", "always"],

            // ── Equality ─────────────────────────────────────────────────────
            // Always use === / !== — never loose == / !=.
            "eqeqeq": ["error", "always"],

            // ── Variable declarations ─────────────────────────────────────────
            // Forbid var; use const or let.
            "no-var": "error",
            // Use const whenever a variable is never reassigned.
            "prefer-const": "error",

            // ── Arrow functions ───────────────────────────────────────────────
            // Always parenthesize arrow-function parameters: (x) => x, not x => x.
            "arrow-parens": ["error", "always"],

            // ── Object / array spacing ────────────────────────────────────────
            // Spaces inside object literal braces: { key: value }, not {key: value}.
            "object-curly-spacing": ["error", "always"]
        }
    }
);
