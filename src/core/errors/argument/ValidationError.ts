import { ArgumentError } from "./ArgumentError";

/**
 * Thrown when multiple validation checks fail simultaneously.
 *
 * @remarks
 * Unlike {@link ArgumentError} (which reports a single failure), `ValidationError`
 * aggregates **all** failed checks into one exception. This allows callers to see
 * every constraint that was violated in a single throw, rather than fixing failures
 * one-at-a-time.
 *
 * Construct via {@link ValidationBuilder} — do not throw `ValidationError` manually:
 *
 * ```ts
 * new ValidationBuilder()
 *     .check(() => ArgumentUtility.checkPositive({ size }))
 *     .check(() => ArgumentUtility.checkNotOptional({ selector }))
 *     .throwIfAny();
 * // → throws ValidationError listing both failures if both checks fail
 * ```
 *
 * The `message` property contains a newline-separated summary of all failures.
 * The `errors` property gives structured access to each individual error message.
 *
 * @example
 * ```ts
 * try {
 *     seq.customOperator(-1, null);
 * } catch (e) {
 *     if (e instanceof ValidationError) {
 *         console.log(e.errors);
 *         // ['size must be positive', 'selector must not be null or undefined']
 *     }
 * }
 * ```
 *
 * @group Errors
 */
export class ValidationError extends ArgumentError {
    /**
     * The individual error messages collected during validation, in the order
     * the checks were registered.
     */
    public readonly errors: readonly string[];

    /**
     * Creates a new `ValidationError`.
     *
     * @param errors - The individual error messages that were collected.
     */
    public constructor(errors: readonly string[]) {
        super(
            `${errors.length} validation error(s):\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join("\n")}`
        );
        this.errors = errors;
    }
}
