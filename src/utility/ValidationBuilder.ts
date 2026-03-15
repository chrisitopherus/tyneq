import { ValidationError } from "../core/errors/argument/ValidationError";

/**
 * Fluent builder that collects **all** validation failures before throwing.
 *
 * @remarks
 * The standard convention is to validate arguments eagerly, before deferred execution begins.
 * When an operator has multiple parameters, throwing on the first failure forces callers to
 * fix one issue at a time. `ValidationBuilder` runs every check, accumulates the error messages
 * of any that fail, and throws a single {@link ValidationError} listing all failures at once.
 *
 * ```ts
 * // In an @operator validate callback:
 * \@operator<[size: unknown, selector: unknown]>('custom', (size, selector) => {
 *     new ValidationBuilder()
 *         .check(() => ArgumentUtility.checkPositive({ size: size as number }))
 *         .check(() => ArgumentUtility.checkNotOptional({ selector }))
 *         .throwIfAny();
 * })
 * ```
 *
 * @group Utility
 */
export class ValidationBuilder {
    private readonly _errors: string[] = [];

    /**
     * Runs `fn` and, if it throws, records the error message.
     *
     * @remarks
     * The check executes immediately. If `fn` throws an `Error`, its `message` is captured;
     * if it throws a non-`Error` value, `String(value)` is used. Either way, execution
     * continues so subsequent checks still run.
     *
     * @param fn - A zero-argument function that throws if the check fails.
     * @returns `this` — enables fluent chaining.
     */
    public check(fn: () => void): this {
        try {
            fn();
        } catch (e) {
            this._errors.push(e instanceof Error ? e.message : String(e));
        }
        
        return this;
    }

    /**
     * Throws a {@link ValidationError} containing all accumulated failure messages, or does
     * nothing if no checks have failed.
     *
     * @throws {ValidationError} When one or more checks recorded an error.
     */
    public throwIfAny(): void {
        if (this._errors.length > 0) {
            throw new ValidationError(this._errors);
        }
    }
}
