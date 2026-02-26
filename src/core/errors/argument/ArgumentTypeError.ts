import { ArgumentError } from "./ArgumentError";

/**
 * Thrown when a method argument has an incorrect type.
 * 
 * @remarks
 * `ArgumentTypeError` is thrown when runtime type validation fails. This is distinct from
 * compile-time type errors and is used for dynamic type checking scenarios where TypeScript's
 * static type system cannot enforce constraints.
 * 
 * Common use cases include:
 * - Validating that a value is a function when expected
 * - Checking instanceof relationships at runtime
 * - Verifying that objects have expected properties or structure
 * - Type guards that need to throw rather than return boolean
 * 
 * This error extends {@link ArgumentError} and includes the `paramName` property to identify
 * which parameter had the type mismatch. The optional `actualType` and `expectedType` properties
 * provide additional debugging context.
 * 
 * @example
 * ```typescript
 * import { ArgumentTypeError } from 'tyneq';
 * 
 * function processCallback(callback: unknown) {
 *   if (typeof callback !== 'function') {
 *     throw new ArgumentTypeError(
 *       'callback',
 *       'function',
 *       typeof callback,
 *       'Callback must be a function'
 *     );
 *   }
 * }
 * 
 * // Throws ArgumentTypeError: "Callback must be a function"
 * processCallback("not a function");
 * ```
 * 
 * @see {@link ArgumentError} for general argument validation errors.
 * @see {@link ArgumentUtility.checkFunction} which throws this error.
 * @see {@link ArgumentUtility.checkInstanceOf} which throws this error.
 */
export class ArgumentTypeError extends ArgumentError {
  /**
   * The expected type as a string (e.g., 'function', 'Date', 'string').
   * 
   * @remarks
   * This is optional and serves as additional debugging context. When present,
   * it describes what type was expected for the parameter.
   */
  public readonly expectedType?: string;

  /**
   * The actual type received as a string (e.g., 'string', 'number', 'object').
   * 
   * @remarks
   * This is optional and serves as additional debugging context. When present,
   * it describes the actual type that was provided, which can be obtained via
   * `typeof value` or constructor name.
   */
  public readonly actualType?: string;

  /**
   * Creates a new ArgumentTypeError.
   * 
   * @param paramName - The name of the parameter that has the wrong type. Required.
   * @param expectedType - Optional string describing the expected type (e.g., 'function', 'Date').
   *                       Stored in {@link expectedType} property for debugging.
   * @param actualType - Optional string describing the actual type received (e.g., 'string', 'number').
   *                     Stored in {@link actualType} property for debugging.
   * @param message - Optional custom error message. If not provided, constructs a message from
   *                  paramName and type information: `"'${paramName}' has incorrect type."`
   *                  or `"'${paramName}' expected type ${expectedType} but got ${actualType}."`
   * @param inner - Optional inner error that caused this error.
   * 
   * @example
   * ```typescript
   * // Minimal - just parameter name
   * throw new ArgumentTypeError('value');
   * // Message: "'value' has incorrect type."
   * 
   * // With expected type
   * throw new ArgumentTypeError('callback', 'function');
   * // Message: "'callback' must be of type function."
   * 
   * // With both types
   * throw new ArgumentTypeError('date', 'Date', 'string');
   * // Message: "'date' expected type Date but got string."
   * 
   * // With custom message
   * throw new ArgumentTypeError(
   *   'handler',
   *   'function',
   *   'object',
   *   'Event handler must be a callable function'
   * );
   * // Message: "Event handler must be a callable function"
   * ```
   */
  constructor(
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
