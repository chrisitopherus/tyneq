import { ArgumentError } from "./ArgumentError";

/**
 * Thrown when a method argument is null when a non-null value is required.
 * 
 * @remarks
 * `ArgumentNullError` is thrown by internal null-check validation when
 * a required parameter is explicitly set to `null`. This is distinct from `undefined`; use
 * {@link ArgumentError} with a custom message for undefined checks.
 * 
 * The error message is automatically formatted to include the parameter name:
 * `"${paramName} cannot be null."` 
 * 
 * This error extends {@link ArgumentError} and includes the `paramName` property.
 * 
 * @example
 * ```typescript
 * import { Tyneq, ArgumentNullError } from 'tyneq';
 * 
 * // Throws ArgumentNullError: "source cannot be null."
 * try {
 *   Tyneq.from(null);
 * } catch (error) {
 *   if (error instanceof ArgumentNullError) {
 *     console.log(`Parameter '${error.paramName}' is null`);
 *   }
 * }
 * 
 * // Manually throw the error
 * throw new ArgumentNullError("predicate");
 * // Message: "predicate cannot be null."
 * ```
 * 
 * @see {@link ArgumentError} for general argument validation errors.
 *
 * @group Errors
 */
export class ArgumentNullError extends ArgumentError {
  /**
   * Creates a new ArgumentNullError.
   * 
   * @param paramName - The name of the parameter that is null. Required.
   *                    This is incorporated into the error message.
   * @param inner - Optional inner error that caused this error.
   * 
   * @remarks
   * The message is automatically constructed as `"${paramName} cannot be null."`
   * and cannot be customized.
   * 
   * @example
   * ```typescript
   * throw new ArgumentNullError("items"); // Message: "items cannot be null."
   * throw new ArgumentNullError("data", originalError); // With inner error
   * ```
   */
  constructor(paramName: string, inner?: Error) {
    super(`${paramName} cannot be null.`, paramName, inner);
  }
}