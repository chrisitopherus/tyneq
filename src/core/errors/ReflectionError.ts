import { TyneqError } from "./TyneqError";

/**
 * Thrown when a prototype reflection operation fails — for example, when a
 * method that is expected to exist on a prototype cannot be found.
 *
 * @example
 * ```ts
 * try { ReflectionUtility.getPrototypeMethod(proto, "missing"); }
 * catch (e) {
 *   if (e instanceof ReflectionError) {
 *     console.log(e.methodName, e.prototypeName, e.message);
 *   }
 * }
 * ```
 *
 * @see {@link TyneqError}
 * @group Errors
 */
export class ReflectionError extends TyneqError {
    /** The name of the method that could not be found. */
    public readonly methodName: string;

    /** The name of the prototype/class that was searched. */
    public readonly prototypeName: string | undefined;

    public constructor(
        message: string,
        methodName: string,
        prototypeName?: string,
        inner?: Error
    ) {
        super(message, { inner });
        this.methodName = methodName;
        this.prototypeName = prototypeName;
    }
}
