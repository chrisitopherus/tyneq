import type { OperatorCategory } from "../types/queryplan";

/**
 * Hidden symbol carrying operator metadata used for query-node construction.
 *
 * @internal
 */
export const tyneqOperatorMetadata: unique symbol = Symbol("tyneq.operatorMetadata");

/**
 * Metadata attached to internal operator classes.
 *
 * @internal
 */
export interface IOperatorMetadata {
    readonly name: string;
    readonly category: Exclude<OperatorCategory, "source">;
}

/**
 * Class-like value that carries internal operator metadata.
 *
 * @internal
 */
export interface IOperatorMetadataCarrier {
    readonly [tyneqOperatorMetadata]: IOperatorMetadata;
}

/**
 * Returns hidden operator metadata from a class carrying Tyneq operator metadata.
 *
 * @internal
 */
export function getOperatorMetadata(target: IOperatorMetadataCarrier): IOperatorMetadata {
    return target[tyneqOperatorMetadata];
}
