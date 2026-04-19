import { Maybe } from "../../types/utility";
import { TyneqError } from "./TyneqError";

/**
 * Thrown when a plugin, decorator (`@operator`, `@terminal`), or factory
 * (`createOperator`, `createTerminalOperator`) is used incorrectly.
 *
 * @example
 * ```ts
 * // @operator('myOp') applied to a class that doesn't extend TyneqEnumerator
 * // throws PluginError with decoratorName = "operator" and targetName = "MyOp"
 * ```
 *
 * @see {@link TyneqError}
 * @group Errors
 */
export class PluginError extends TyneqError {
    /**
     * The name of the decorator or factory that produced the error.
     * e.g. `"operator"`, `"terminal"`, `"createOperator"`.
     */
    public readonly decoratorName: string;

    /**
     * The name of the class or function the decorator was applied to, if available.
     */
    public readonly targetName: Maybe<string>;

    public constructor(
        message: string,
        decoratorName: string,
        targetName?: string,
        inner?: Error
    ) {
        super(message, { inner });
        this.decoratorName = decoratorName;
        this.targetName = targetName;
    }
}
