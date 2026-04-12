import { OperatorKind, OperatorSource, SequenceConstructor } from "../types/core";
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";
import type { Maybe } from "../types/utility";

/** @internal Sentinel value for explicitly omitting `targetClass`. */
const NO_TARGET: unique symbol = Symbol("NO_TARGET");

/**
 * Metadata describing a registered operator.
 *
 * @group Classes
 */
export class OperatorMetadata {
    public readonly name: string;
    public readonly kind: OperatorKind;
    public readonly source: OperatorSource;
    public readonly targetClass: Maybe<SequenceConstructor>;
    public readonly extensions: Readonly<Record<string, unknown>>;

    public constructor(
        name: string,
        kind: OperatorKind,
        source: OperatorSource = "external",
        targetClass: Maybe<SequenceConstructor> | typeof NO_TARGET = TyneqEnumerableBase,
        extensions: Readonly<Record<string, unknown>> = {}
    ) {
        this.name = name;
        this.kind = kind;
        this.source = source;
        this.targetClass = targetClass === NO_TARGET ? undefined : targetClass;
        this.extensions = extensions;
    }

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
        return new OperatorMetadata(name, "source", src, NO_TARGET);
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
