import { OperatorMetadata } from "../../core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { TyneqCachedEnumerable } from "../../core/TyneqCachedEnumerable";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import type { OperatorSource, TyneqCachedSequence } from "../../types/core";
import type { QueryPlanNode } from "../../types/queryplan";
import { RegistrationUtility } from "../RegistrationUtility";

/**
 * Registers a factory function as an operator available only on cached sequences,
 * where the factory fully controls the return type.
 *
 * Use this when the operator must return a `TyneqCachedSequence`. The factory
 * receives the cached source and a query plan node. It is responsible for
 * constructing and returning the result sequence.
 *
 * For operators that return a plain sequence from an enumerator class, use `@cachedOperator`.
 *
 * @param config.name - Method name to expose on cached sequences.
 * @param config.category - Operator kind (`"streaming"` | `"buffer"`).
 * @param config.factory - Constructs the result sequence from `(source, node, ...userArgs)`.
 * @param config.validate - Optional eager validation function for user-supplied arguments.
 *
 * @example
 * ```ts
 * createCachedOperator({
 *     name: "refreshWith",
 *     category: "buffer",
 *     factory: (source, node, newSource: Iterable<unknown>) => {
 *         const seq = tyneqFrom(newSource);
 *         return new TyneqCachedEnumerable(seq, node);
 *     },
 *     validate: (newSource) => {
 *         if (newSource == null) throw new Error("newSource must not be null");
 *     }
 * });
 * ```
 *
 * @group Factory Functions
 */
export function createCachedOperator<TSource, TArgs extends unknown[]>(config: {
    name: string;
    category: "streaming" | "buffer";
    factory: (source: TyneqCachedEnumerable<TSource>, node: QueryPlanNode, ...args: TArgs) => TyneqCachedSequence<TSource>;
    validate?: (...args: NoInfer<TArgs>) => void;
    source?: OperatorSource;
}): void {
    OperatorRegistry.register({
        metadata: OperatorMetadata.forCategory(config.category, config.name, TyneqCachedEnumerable, config.source),
        impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
            config.validate?.(...(userArgs as TArgs));
            const source = this as unknown as TyneqCachedEnumerable<TSource>;
            const node = RegistrationUtility.buildQueryNode(this, config.name, userArgs, config.category);
            return config.factory(source, node, ...(userArgs as TArgs));
        }
    });
}
