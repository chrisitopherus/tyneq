import { ValidationError } from "../core/errors/argument/ValidationError";

/**
 * Accumulates validation errors and throws a single `ValidationError` containing all of them.
 *
 * Use when multiple independent arguments must be validated together so callers see all
 * failures in one throw rather than one at a time.
 *
 * @example
 * ```ts
 * new ValidationBuilder()
 *     .check(() => ArgumentUtility.checkNotOptional({ selector }))
 *     .check(() => ArgumentUtility.checkPositive({ count }))
 *     .throwIfAny();
 * ```
 *
 * @group Utilities
 */
export class ValidationBuilder {
    private readonly errors: string[] = [];

    /**
     * Runs `fn` and collects any thrown error message. Returns `this` for chaining.
     */
    public check(fn: () => void): this {
        try {
            fn();
        } catch (e) {
            this.errors.push(e instanceof Error ? e.message : String(e));
        }

        return this;
    }

    /**
     * Throws a `ValidationError` with all collected messages if any `check` calls failed.
     * Does nothing when no errors were collected.
     */
    public throwIfAny(): void {
        if (this.errors.length > 0) {
            throw new ValidationError(this.errors);
        }
    }
}
