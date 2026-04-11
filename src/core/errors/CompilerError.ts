import { Maybe } from "../../types/utility";
import { TyneqError } from "./TyneqError";

/**
 * Thrown when the query plan compiler encounters a structural or semantic error
 * while compiling a query plan into an executable sequence.
 *
 * @example
 * ```ts
 * try { compiler.compile(plan); }
 * catch (e) {
 *   if (e instanceof CompilerError) {
 *     console.log(e.operatorName, e.phase, e.message);
 *   }
 * }
 * ```
 *
 * @see {@link TyneqError}
 * @group Errors
 */
export class CompilerError extends TyneqError {
    /** The name of the operator being compiled when the error occurred, if known. */
    public readonly operatorName: Maybe<string>;

    /**
     * The compilation phase in which the error occurred.
     * - `"transform"` - during query plan transformation (pre-compile)
     * - `"source"` - while compiling a source node
     * - `"operator"` - while applying an operator node
     */
    public readonly phase: "transform" | "source" | "operator";

    public constructor(
        message: string,
        phase: "transform" | "source" | "operator",
        operatorName?: string,
        inner?: Error
    ) {
        super(message, { inner });
        this.phase = phase;
        this.operatorName = operatorName;
    }
}
