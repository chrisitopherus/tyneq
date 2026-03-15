import { ArgumentError } from "./ArgumentError";

/**
 * Thrown when an argument has an incorrect runtime type.
 *
 * @remarks
 * Used for dynamic type validation that TypeScript's static type system cannot enforce.
 * The optional `expectedType` and `actualType` properties provide debugging context.
 *
 * @example
 * ```ts
 * if (typeof callback !== 'function') {
 *   throw new ArgumentTypeError('callback', 'function', typeof callback);
 * }
 * ```
 *
 * @see {@link ArgumentError} for general argument validation errors.
 *
 * @group Errors
 */
export class ArgumentTypeError extends ArgumentError {
    /**
     * The expected type, e.g. `'function'` or `'Date'`.
     */
    public readonly expectedType?: string;

    /**
     * The actual type received, e.g. `'string'` or `'number'`.
     */
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
