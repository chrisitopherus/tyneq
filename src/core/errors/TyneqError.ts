/**
 * Base error class for all Tyneq library errors.
 * 
 * @remarks
 * `TyneqError` serves as the root exception type for the entire Tyneq library.
 * It extends the native `Error` class and adds support for wrapping inner errors,
 * enabling error chaining useful for debugging and diagnostics.
 * 
 * All other Tyneq error classes inherit from this class. By catching `TyneqError`,
 * you can catch any Tyneq-specific exception.
 * 
 * The error name is automatically set to the derived class name (e.g., `InvalidOperationError`,
 * `ArgumentNullError`) via `new.target.name`, and the prototype chain is properly
 * configured to support `instanceof` checks and TypeScript's error discrimination.
 * 
 * @example
 * ```typescript
 * import { TyneqError } from 'tyneq';
 * 
 * try {
 *   // Some Tyneq operation that might fail
 * } catch (error) {
 *   if (error instanceof TyneqError) {
 *     console.log(`Tyneq error [${error.name}]: ${error.message}`);
 *     if (error.inner) {
 *       console.log(`Caused by: ${error.inner.message}`);
 *     }
 *   }
 * }
 * ```
 */
export class TyneqError extends Error {
    /**
     * Optional inner error that caused this error.
     * Supports error chaining for debugging and diagnostics.
     * 
     * @remarks
     * Useful when an operation fails due to an underlying error (e.g., a custom
     * validation function throws, a user predicate throws, etc.).
     * The inner error provides the root cause context.
     */
    public inner: Error | undefined;

    /**
     * Creates a new TyneqError.
     * 
     * @param message - The error message describing what went wrong.
     * @param options - Optional configuration object.
     * @param options.inner - Optional inner error that caused this error.
     * 
     * @example
     * ```typescript
     * throw new TyneqError("Something went wrong");
     * 
     * // With inner error
     * try {
     *   // some operation
     * } catch (originalError) {
     *   throw new TyneqError("Failed to process sequence", { inner: originalError });
     * }
     * ```
     */
    public constructor(message: string, options?: { inner?: Error}) {
        super(message);
        this.name = new.target.name;
        this.inner = options?.inner;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}