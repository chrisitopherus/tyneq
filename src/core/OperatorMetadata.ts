import { OperatorKind, OperatorSource, SequenceConstructor } from "../types/core";
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";

/**
 * Metadata describing a registered operator.
 *
 * @group Classes
 */
export class OperatorMetadata {

    public constructor(
        public readonly name: string,
        public readonly kind: OperatorKind,
        public readonly source: OperatorSource = "external",
        public readonly targetClass: SequenceConstructor = TyneqEnumerableBase,
        public readonly extensions: Readonly<Record<string, unknown>> = {}
    ) { }

    /** Creates metadata for a streaming operator. Defaults targetClass to TyneqEnumerableBase. */
    public static streaming(
        name: string,
        targetClass: SequenceConstructor = TyneqEnumerableBase,
        source?: OperatorSource,
        extensions?: Record<string, unknown>
    ): OperatorMetadata {
        return new OperatorMetadata(name, "streaming", source ?? "external", targetClass, extensions);
    }

    /** Creates metadata for a buffering operator. Defaults targetClass to TyneqEnumerableBase. */
    public static buffer(
        name: string,
        targetClass: SequenceConstructor = TyneqEnumerableBase,
        source?: OperatorSource,
        extensions?: Record<string, unknown>
    ): OperatorMetadata {
        return new OperatorMetadata(name, "buffer", source ?? "external", targetClass, extensions);
    }

    /** Creates metadata for a terminal operator. Defaults targetClass to TyneqEnumerableBase. */
    public static terminal(
        name: string,
        targetClass: SequenceConstructor = TyneqEnumerableBase,
        source?: OperatorSource,
        extensions?: Record<string, unknown>
    ): OperatorMetadata {
        return new OperatorMetadata(name, "terminal", source ?? "external", targetClass, extensions);
    }
}