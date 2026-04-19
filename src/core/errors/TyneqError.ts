import { Maybe } from "../../types/utility";

/**
 * Base class for all errors thrown by Tyneq.
 *
 * @example
 * ```ts
 * try { Tyneq.from([]).first(); }
 * catch (e) { if (e instanceof TyneqError) { console.log(e.message); } }
 * ```
 *
 * @group Errors
 */
export class TyneqError extends Error {

    /** The underlying error that caused this error, if any. */
    public inner: Maybe<Error>;

    public constructor(message: string, options?: { inner?: Error}) {
        super(message);
        this.name = new.target.name;
        this.inner = options?.inner;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
