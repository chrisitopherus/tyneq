import { IOperatorMetadata, IOperatorMetadataCarrier, OperatorSource } from "../../types/core";
import { WithProperties } from "../../types/utility";

/**
 * Metadata describing a registered operator.
 *
 * @group Classes
 */
export class OperatorMetadata {

    public constructor(
        public readonly name: string,
        public readonly kind: "streaming" | "buffer" | "terminal",
        public readonly source: "internal" | "external" = "external",
        public readonly extensions: Readonly<Record<string, unknown>> = {}
    ) { }

    /** Creates metadata for a streaming operator registered from an external plugin. */
    public static streaming(name: string, source?: OperatorSource, extensions?: Record<string, unknown>): OperatorMetadata {
        return new OperatorMetadata(name, "streaming", source ?? "external", extensions);
    }

    /** Creates metadata for a buffering operator registered from an external plugin. */
    public static buffer(name: string, source?: OperatorSource, extensions?: Record<string, unknown>): OperatorMetadata {
        return new OperatorMetadata(name, "buffer", source ?? "external", extensions);
    }

    /** Creates metadata for a terminal operator registered from an external plugin. */
    public static terminal(name: string, source?: OperatorSource, extensions?: Record<string, unknown>): OperatorMetadata {
        return new OperatorMetadata(name, "terminal", source ?? "external", extensions);
    }
}

/**
 * Well-known symbol used to attach operator metadata to class constructors.
 * Read at query-plan inspection time.
 *
 * @internal
 */
export const tyneqOperatorMetadata: unique symbol = Symbol("tyneq.operatorMetadata");

/** Reads the operator metadata from a carrier. @internal */
export function getOperatorMetadata(target: IOperatorMetadataCarrier): IOperatorMetadata {
    return target[tyneqOperatorMetadata];
}

/** Writes operator metadata to a carrier. @internal */
export function setOperatorMetadata<T extends object>(target: T, metadata: IOperatorMetadata): void {
    (target as WithProperties<typeof tyneqOperatorMetadata, IOperatorMetadata>)[tyneqOperatorMetadata] = metadata;
}