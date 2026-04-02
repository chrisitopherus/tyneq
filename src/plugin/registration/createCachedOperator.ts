import { OperatorMetadata } from "../../core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { TyneqCachedEnumerable } from "../../core/TyneqCachedEnumerable";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { QueryNode } from "../../queryplan/QueryNode";
import type { OperatorKind, TyneqCachedSequence } from "../../types/core";
import type { OperatorCategory, QueryPlanNode } from "../../types/queryplan";
import { tyneqQueryNode } from "../../types/queryplan";

/**
 * Registers a factory function as an operator available only on cached sequences,
 * where the factory fully controls the return type.
 *
 * Use this when the operator must return a `TyneqCachedSequence`. For operators that return
 * a plain sequence from an enumerator class, use `@cachedOperator`.
 *
 * The factory receives the cached sequence, the query node, and any user arguments.
 * It is responsible for constructing and returning the result sequence.
 *
 * @param name - Method name to expose on cached sequences.
 * @param category - Operator kind.
 * @param factory - Constructs the result sequence from `(source, node, ...userArgs)`.
 * @param validate - Optional eager validation function for user-supplied arguments.
 *
 * @example
 * ```ts
 * createCachedOperator(
 *     "refreshWith",
 *     "cache",
 *     (source, node, newSource: Iterable<unknown>) => {
 *         const seq = tyneqFrom(newSource);
 *         return new TyneqCachedEnumerable(seq, node);
 *     },
 *     (newSource) => {
 *         if (newSource == null) throw new Error("newSource must not be null");
 *     }
 * );
 * ```
 *
 * @group Utilities
 */
export function createCachedOperator<TSource, TArgs extends unknown[]>(
    name: string,
    category: OperatorKind,
    factory: (source: TyneqCachedEnumerable<TSource>, node: QueryPlanNode, ...args: TArgs) => TyneqCachedSequence<TSource>,
    validate?: (...args: TArgs) => void
): void {
    OperatorRegistry.register({
        metadata: new OperatorMetadata(name, category, "external", TyneqCachedEnumerable),
        impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
            validate?.(...(userArgs as TArgs));
            const source = this as unknown as TyneqCachedEnumerable<TSource>;
            const node = new QueryNode(name, userArgs, source[tyneqQueryNode], category as OperatorCategory);
            return factory(source, node, ...(userArgs as TArgs));
        }
    });
}
