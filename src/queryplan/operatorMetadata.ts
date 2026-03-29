import type { OperatorCategory } from "../types/queryplan";

/**
 * Well-known symbol used to attach operator metadata to class constructors.
 * Read at query-plan inspection time.
 *
 * @internal
 */
export const tyneqOperatorMetadata: unique symbol = Symbol("tyneq.operatorMetadata");

/**
 * Metadata attached to a built-in operator constructor via `tyneqOperatorMetadata`.
 *
 * @internal
 */
export interface IOperatorMetadata {
    readonly name: string;
    readonly category: Exclude<OperatorCategory, "source">;
}

/** Structural interface for classes that carry `tyneqOperatorMetadata`. @internal */
export interface IOperatorMetadataCarrier {
    readonly [tyneqOperatorMetadata]: IOperatorMetadata;
}

/** Reads the operator metadata from a carrier. @internal */
export function getOperatorMetadata(target: IOperatorMetadataCarrier): IOperatorMetadata {
    return target[tyneqOperatorMetadata];
}
