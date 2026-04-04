import { OperatorMetadata } from "../../core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { TyneqOrderedEnumerable } from "../../core/ordering/TyneqOrderedEnumerable";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import type { OperatorSource } from "../../types/core";
import { OrderedEnumerable } from "../../types/core";

/**
 * Registers a terminal operator available only on ordered sequences.
 *
 * The `execute` function receives the full `OrderedEnumerable` as its first argument,
 * giving access to ordered-sequence members (comparers, parent chain, etc.).
 *
 * @param config.name - Method name to expose on ordered sequences.
 * @param config.execute - Function that consumes the ordered source and returns a result.
 * @param config.validate - Optional eager validation for user-supplied arguments.
 *
 * @example
 * ```ts
 * createOrderedTerminalOperator({
 *     name: "isSorted",
 *     execute(source: OrderedEnumerable<number>): boolean {
 *         const items = [...source];
 *         for (let i = 1; i < items.length; i++) {
 *             if (items[i - 1] > items[i]) return false;
 *         }
 *         return true;
 *     }
 * });
 * ```
 *
 * @group Utilities
 */
export function createOrderedTerminalOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    execute: (source: OrderedEnumerable<TSource>, ...args: TArgs) => TResult;
    validate?: (...args: NoInfer<TArgs>) => void;
    source?: OperatorSource;
}): void {
    OperatorRegistry.register({
        metadata: new OperatorMetadata(config.name, "terminal", config.source ?? "external", TyneqOrderedEnumerable),
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            return config.execute(this as unknown as OrderedEnumerable<TSource>, ...(args as TArgs));
        }
    });
}
