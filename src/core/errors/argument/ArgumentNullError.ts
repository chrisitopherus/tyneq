import { ArgumentError } from "./ArgumentError";

/**
 * Thrown when a required argument is `null`.
 *
 * @example
 * ```ts
 * try { Tyneq.from([1, 2]).select(null as any); }
 * catch (e) { if (e instanceof ArgumentNullError) { console.log(e.paramName); } }
 * ```
 *
 * @see {@link ArgumentError}
 * @group Errors
 */
export class ArgumentNullError extends ArgumentError {
    public constructor(paramName: string, inner?: Error) {
        super(`${paramName} cannot be null.`, paramName, inner);
    }
}
