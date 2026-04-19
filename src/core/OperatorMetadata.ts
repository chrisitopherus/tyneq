import { OperatorKind, OperatorSource, SequenceConstructor } from "../types/core";
import { TyneqEnumerableBase } from "./TyneqEnumerableBase";
import { PluginError } from "./errors/PluginError";
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

    /**
     * Creates metadata for a streaming or buffer operator determined at runtime.
     *
     * @remarks
     * Use when the category is a variable rather than a compile-time literal --
     * for example in `@operator` and `@orderedOperator` whose `category` parameter
     * is provided by the caller. For compile-time-known categories prefer the
     * dedicated {@link streaming} / {@link buffer} / {@link terminal} statics.
     *
     * Only `"streaming"` and `"buffer"` are valid; passing `"terminal"` or `"source"` throws.
     */
    public static forCategory(
        category: "streaming" | "buffer",
        name: string,
        targetClass: SequenceConstructor = TyneqEnumerableBase,
        source?: OperatorSource,
        extensions?: Record<string, unknown>
    ): OperatorMetadata {
        if (category === "streaming") {
            return OperatorMetadata.streaming(name, targetClass, source, extensions);
        }
        if (category === "buffer") {
            return OperatorMetadata.buffer(name, targetClass, source, extensions);
        }

        throw new PluginError(
            `OperatorMetadata.forCategory: unsupported category "${category}". Use .terminal() or .source() directly.`,
            "forCategory",
            name
        );
    }
}
