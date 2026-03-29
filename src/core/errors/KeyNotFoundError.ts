import { TyneqError } from "./TyneqError";

/**
 * Thrown when a lookup is performed with a key that does not exist in the collection.
 *
 * @example
 * ```ts
 * try { seq.toMap((x) => x.id).get(999); }
 * catch (e) { if (e instanceof KeyNotFoundError) { ... } }
 * ```
 *
 * @see {@link TyneqError}
 * @group Errors
 */
export class KeyNotFoundError extends TyneqError {
    public constructor(message = "The given key was not present in the dictionary.", inner?: Error) {
        super(message, { inner });
    }
}
