/**
 * Base error class for all Tyneq library errors.
 *
 * @remarks
 * Extends `Error` with optional inner-error chaining. The `name` property is set to the
 * derived class name via `new.target.name`, so `instanceof` checks work correctly for all
 * subclasses.
 *
 * Catch `TyneqError` to handle any Tyneq-specific exception.
 *
 * @example
 * ```ts
 * try {
 *   Tyneq.from([]).first();
 * } catch (e) {
 *   if (e instanceof TyneqError) {
 *     console.log(`[${e.name}]: ${e.message}`);
 *     if (e.inner) console.log(`Caused by: ${e.inner.message}`);
 *   }
 * }
 * ```
 *
 * @group Errors
 */
export class TyneqError extends Error {
    /**
     * The error that caused this one, if any.
     */
    public inner: Error | undefined;

    public constructor(message: string, options?: { inner?: Error}) {
        super(message);
        this.name = new.target.name;
        this.inner = options?.inner;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
