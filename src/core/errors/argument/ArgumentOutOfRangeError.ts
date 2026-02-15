import { ArgumentError } from "./ArgumentError";

/**
 * Thrown when a method argument value is outside the acceptable range or constraints.
 * 
 * @remarks
 * `ArgumentOutOfRangeError` is thrown by {@link ArgumentUtility} validation methods
 * ({@link ArgumentUtility.checkNonNegative checkNonNegative()}, 
 * {@link ArgumentUtility.checkPositive checkPositive()},
 * {@link ArgumentUtility.checkInRange checkInRange()}) when a numeric argument
 * violates specific constraints.
 * 
 * Common violations include:
 * - Negative value when non-negative is required (e.g., count, index, length parameters)
 * - Zero or negative value when positive is required
 * - Value outside a specified range [min, max]
 * - Non-integer value when an integer is required
 * 
 * The error supports capturing the actual out-of-range value via the `actualValue` property,
 * which is useful for debugging when you need to see what value was rejected.
 * 
 * This error extends {@link ArgumentError} and includes both `paramName` and `actualValue` properties.
 * 
 * @example
 * ```typescript
 * import { Tyneq, ArgumentOutOfRangeError } from 'tyneq';
 * 
 * // Throws ArgumentOutOfRangeError: "'count' must be a non-negative number."
 * try {
 *   Tyneq.range(0, -5); // start=-5 is out of range
 * } catch (error) {
 *   if (error instanceof ArgumentOutOfRangeError) {
 *     console.log(`Parameter '${error.paramName}' with value ${error.actualValue} is out of range`);
 *   }
 * }
 * 
 * // Manually throw with actual value
 * throw new ArgumentOutOfRangeError("index", "Index must be non-negative", -1);
 * ```
 * 
 * @see {@link ArgumentError} for general argument validation errors.
 * @see {@link ArgumentUtility} for validation methods that throw this error.
 */
export class ArgumentOutOfRangeError extends ArgumentError {
  /**
   * The actual out-of-range value that was passed to the method.
   * 
   * @remarks
   * This property may be undefined if the actual value was not captured when the error was created.
   * When present, it helps debug by showing exactly which value violated the constraint.
   */
  public readonly actualValue?: unknown;

  /**
   * Creates a new ArgumentOutOfRangeError.
   * 
   * @param paramName - The name of the parameter that is out of range. Required.
   * @param message - Optional custom error message. If not provided, defaults to
   *                  `"${paramName} was out of range."`. A custom message should explain
   *                  the specific constraint violated (e.g., "must be non-negative", "must be between 1 and 10").
   * @param actualValue - Optional actual value that was out of range. Stored in the
   *                      {@link actualValue} property for debugging.
   * @param inner - Optional inner error that caused this error.
   * 
   * @example
   * ```typescript
   * // Default message
   * throw new ArgumentOutOfRangeError("count", undefined, -5);
   * // Message: "count was out of range."
   * // actualValue: -5
   * 
   * // Custom message
   * throw new ArgumentOutOfRangeError(
   *   "index",
   *   "Index must be non-negative",
   *   -1
   * );
   * // Message: "Index must be non-negative"
   * // actualValue: -1
   * 
   * // With range constraint
   * throw new ArgumentOutOfRangeError(
   *   "value",
   *   "'value' must be in range [1, 100].",
   *   -5
   * );
   * ```
   */
  constructor(paramName: string, message?: string, actualValue?: unknown, inner?: Error) {
    super(message ?? `${paramName} was out of range.`, paramName, inner);
    this.actualValue = actualValue;
  }
}