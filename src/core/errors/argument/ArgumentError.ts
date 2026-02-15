import { TyneqError } from "../TyneqError";

/**
 * Thrown when a method argument fails validation.
 * 
 * @remarks
 * `ArgumentError` is the base class for all argument-related validation errors in the Tyneq library.
 * It extends {@link TyneqError} and provides an optional `paramName` property to identify which
 * parameter caused the validation failure.
 * 
 * All Tyneq methods validate their arguments using the {@link ArgumentUtility} class, which throws
 * `ArgumentError` or its subclasses ({@link ArgumentNullError}, {@link ArgumentOutOfRangeError})
 * when validation fails.
 * 
 * Common validation checks include:
 * - Null/undefined checks
 * - Empty collection checks
 * - Numeric range and sign checks
 * - String whitespace checks
 * - Custom predicate-based validation
 * 
 * The `paramName` property helps identify which parameter caused the error, improving debugging experience.
 * 
 * @example
 * ```typescript
 * import { Tyneq, ArgumentError } from 'tyneq';
 * 
 * try {
 *   // Pass an invalid argument
 *   Tyneq.from(null); // paramName would be "source"
 * } catch (error) {
 *   if (error instanceof ArgumentError) {
 *     console.log(`Parameter '${error.paramName}' validation failed: ${error.message}`);
 *   }
 * }
 * 
 * // Manually create an ArgumentError
 * throw new ArgumentError("Value must be positive", "count");
 * ```
 * 
 * @see {@link ArgumentNullError} for null argument errors.
 * @see {@link ArgumentOutOfRangeError} for out-of-range argument errors.
 * @see {@link ArgumentUtility} for validation utilities.
 */
export class ArgumentError extends TyneqError {
  /**
   * The name of the parameter that failed validation.
   * 
   * @remarks
   * This property is optional and may be undefined if the error is created without specifying a parameter name.
   * When present, it helps identify which parameter caused the validation failure, useful for debugging.
   */
  public readonly paramName?: string;

  /**
   * Creates a new ArgumentError.
   * 
   * @param message - The error message describing the validation failure.
   * @param paramName - Optional name of the parameter that failed validation.
   *                    Used to identify which argument caused the error.
   * @param inner - Optional inner error that caused this error.
   * 
   * @example
   * ```typescript
   * // With parameter name
   * throw new ArgumentError("Value must be a string", "name");
   * 
   * // Without parameter name
   * throw new ArgumentError("All arguments must be valid");
   * 
   * // With inner error
   * try {
   *   validateCustom(value);
   * } catch (validationError) {
   *   throw new ArgumentError("Custom validation failed", "value", validationError);
   * }
   * ```
   */
  constructor(message: string, paramName?: string, inner?: Error) {
    super(message, { inner });
    this.paramName = paramName;
  }
}