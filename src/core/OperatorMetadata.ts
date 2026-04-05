import { OperatorKind, OperatorSource, SequenceConstructor } from "../types/core";
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";
import type { Maybe } from "../types/utility";

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
        public readonly targetClass: Maybe<SequenceConstructor> = TyneqEnumerableBase,
        public readonly extensions: Readonly<Record<string, unknown>> = {}
    ) { }

    /**
     * Creates metadata for a source operator.
     *
     * @remarks
     * `targetClass` is always `undefined` for source operators -- they are static
     * factories with no prototype and are never patched onto a class instance.
     */
    public static source(
        name: string,
        src: OperatorSource = "external"
    ): OperatorMetadata {
        // `targetClass` must be explicitly unset after construction because the constructor
        // parameter defaults to TyneqEnumerableBase when undefined is passed (JS default param
        // semantics). Object.assign bypasses the readonly constraint at runtime (readonly is
        // compile-time only) to store the correct value.
        return Object.assign(new OperatorMetadata(name, "source", src), { targetClass: undefined as Maybe<SequenceConstructor> });
    }

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