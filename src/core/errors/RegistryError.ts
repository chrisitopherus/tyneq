import { TyneqError } from "./TyneqError";
import { OperatorMetadata } from "../OperatorMetadata";

/**
 * Thrown when the operator registry encounters a conflict or invalid state
 * during operator registration or invocation.
 *
 * @example
 * ```ts
 * try { OperatorRegistry.register(entry); }
 * catch (e) {
 *   if (e instanceof RegistryError) {
 *     console.log(e.operatorName, e.conflictingKind, e.message);
 *   }
 * }
 * ```
 *
 * @see {@link TyneqError}
 * @group Errors
 */
export class RegistryError extends TyneqError {
    /** The name of the operator involved in the error. */
    public readonly operatorName: string;

    /**
     * The kind of the operator that was being registered or invoked.
     * `undefined` if the kind is not applicable to this error.
     */
    public readonly kind: OperatorMetadata["kind"] | undefined;

    /**
     * The kind already present in the registry for this name, when there is a conflict.
     * `undefined` when the error is not a duplicate-registration conflict.
     */
    public readonly conflictingKind: OperatorMetadata["kind"] | undefined;

    /**
     * The source that originally registered the conflicting operator.
     * `undefined` when the error is not a duplicate-registration conflict.
     */
    public readonly conflictingSource: OperatorMetadata["source"] | undefined;

    public constructor(
        message: string,
        operatorName: string,
        kind?: OperatorMetadata["kind"],
        conflict?: { kind: OperatorMetadata["kind"]; source: OperatorMetadata["source"] },
        inner?: Error
    ) {
        super(message, { inner });
        this.operatorName = operatorName;
        this.kind = kind;
        this.conflictingKind = conflict?.kind;
        this.conflictingSource = conflict?.source;
    }
}
