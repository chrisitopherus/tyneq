import { TyneqError } from "../TyneqError";

/**
 * Thrown when a method argument fails validation.
 *
 * @example
 * ```ts
 * try { Tyneq.from([]).take(-1); }
 * catch (e) { if (e instanceof ArgumentError) { console.log(e.paramName); } }
 * ```
 *
 * @see {@link TyneqError}
 * @group Errors
 */
export class ArgumentError extends TyneqError {
    /** The name of the parameter that caused the error. */
    public readonly paramName?: string;

    public constructor(message: string, paramName?: string, inner?: Error) {
        super(message, { inner });
        this.paramName = paramName;
    }
}
