import { ArgumentError } from "./ArgumentError";

/**
 * Thrown when multiple argument validations fail simultaneously.
 *
 * @remarks
 * `errors` contains one message per failed validation.
 * Thrown by `ValidationBuilder.throwIfAny()` when at least one check failed.
 *
 * @example
 * ```ts
 * try { seq.someOperator(badArg1, badArg2); }
 * catch (e) { if (e instanceof ValidationError) { console.log(e.errors); } }
 * ```
 *
 * @see {@link ArgumentError}
 * @group Errors
 */
export class ValidationError extends ArgumentError {
    /** The individual validation failure messages. */
    public readonly errors: readonly string[];

    public constructor(errors: readonly string[]) {
        super(
            `${errors.length} validation error(s):\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join("\n")}`
        );
        this.errors = errors;
    }
}
