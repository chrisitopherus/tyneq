import { ValidationError } from '../core/errors/argument/ValidationError';

/**
 * Fluent builder that collects **all** validation failures before throwing.
 *
 * @remarks
 * The standard LINQ convention is to validate arguments eagerly (at call-site, before
 * deferred execution begins). When an operator has multiple parameters, throwing on the
 * first bad argument forces callers to fix one issue at a time — a poor DX.
 *
 * `ValidationBuilder` solves this by running every check, accumulating the error
 * messages of any that fail, and then throwing a single {@link ValidationError} that
 * lists **all** failures at once. Only checks that throw contribute to the list;
 * passing checks have no effect.
 *
 * ## Usage
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
 * Or inline without the fluent chain:
 *
 * ```ts
 * const vb = new ValidationBuilder();
 * vb.check(() => ArgumentUtility.checkNonNegative({ index: index as number }));
 * vb.check(() => ArgumentUtility.checkNotOptional({ predicate }));
 * vb.throwIfAny();
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
     * The check is executed immediately. If `fn` throws an `Error`, its `message`
     * is captured. If it throws a non-`Error` value, `String(value)` is used.
     * Either way, execution continues and subsequent checks are still run.
     *
     * @param fn - A zero-argument function that performs one validation check by
     *   throwing if the check fails (e.g., an {@link ArgumentUtility} call).
     * @returns `this` — enabling fluent chaining.
     *
     * @example
     * ```ts
     * new ValidationBuilder()
     *     .check(() => ArgumentUtility.checkPositive({ size: size as number }))
     *     .check(() => ArgumentUtility.checkNotOptional({ selector }))
     *     .throwIfAny();
     * ```
     */
    check(fn: () => void): this {
        try {
            fn();
        } catch (e) {
            this._errors.push(e instanceof Error ? e.message : String(e));
        }
        return this;
    }

    /**
     * Throws a {@link ValidationError} if any checks have failed; otherwise does nothing.
     *
     * @remarks
     * Call this once after all `.check()` calls. The thrown error contains the
     * messages of every failed check in registration order.
     *
     * @throws {ValidationError} When one or more checks recorded an error.
     *
     * @example
     * ```ts
     * new ValidationBuilder()
     *     .check(() => ArgumentUtility.checkPositive({ size: size as number }))
     *     .throwIfAny(); // throws if size <= 0
     * ```
     */
    throwIfAny(): void {
        if (this._errors.length > 0) {
            throw new ValidationError(this._errors);
        }
    }
}
