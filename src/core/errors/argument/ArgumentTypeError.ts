import { ArgumentError } from "./ArgumentError";

/**
 * Thrown when an argument has the wrong type.
 *
 * @example
 * ```ts
 * try { Tyneq.from([1, 2]).where("not a function" as any); }
 * catch (e) { if (e instanceof ArgumentTypeError) { console.log(e.expectedType, e.actualType); } }
 * ```
 *
 * @see {@link ArgumentError}
 * @group Errors
 */
export class ArgumentTypeError extends ArgumentError {
    /** The expected type name. */
    public readonly expectedType?: string;

    /** The actual type name received. */
    public readonly actualType?: string;

    public constructor(
        paramName: string,
        expectedType?: string,
        actualType?: string,
        message?: string,
        inner?: Error
    ) {
        let errorMessage: string;

        if (message) {
            errorMessage = message;
        } else if (expectedType && actualType) {
            errorMessage = `'${paramName}' expected type ${expectedType} but got ${actualType}.`;
        } else if (expectedType) {
            errorMessage = `'${paramName}' must be of type ${expectedType}.`;
        } else {
            errorMessage = `'${paramName}' has incorrect type.`;
        }

        super(errorMessage, paramName, inner);
        this.expectedType = expectedType;
        this.actualType = actualType;
    }
}
