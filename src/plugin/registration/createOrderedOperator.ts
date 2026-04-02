import { OperatorMetadata } from "../../core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { TyneqOrderedEnumerable } from "../../core/ordering/TyneqOrderedEnumerable";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { QueryNode } from "../../queryplan/QueryNode";
import type { OperatorKind, TyneqOrderedSequence } from "../../types/core";
import type { OperatorCategory, QueryPlanNode } from "../../types/queryplan";
import { tyneqQueryNode } from "../../types/queryplan";

/**
 * Registers a factory function as an operator available only on ordered sequences,
 * where the factory fully controls the return type.
 *
 * Use this when the operator must return a `TyneqOrderedSequence` (e.g. a `thenBy` variant).
 * For operators that return a plain sequence from an enumerator class, use `@orderedOperator`.
 *
 * The factory receives the ordered sequence, the query node, and any user arguments.
 * It is responsible for constructing and returning the result sequence — typically:
 * `new TyneqOrderedEnumerable(source.source, keySelector, comparer, descending, source, node)`.
 *
 * @param name - Method name to expose on ordered sequences.
 * @param category - Operator kind (`"streaming"` | `"buffer"`).
 * @param factory - Constructs the result sequence from `(source, node, ...userArgs)`.
 * @param validate - Optional eager validation function for user-supplied arguments.
 *
 * @example
 * ```ts
 * createOrderedOperator(
 *     "thenByLocale",
 *     "buffer",
 *     (source, node, locale: string, keySelector: (item: unknown) => string) =>
 *         new TyneqOrderedEnumerable(
 *             source.source,
 *             keySelector,
 *             (a, b) => a.localeCompare(b, locale),
 *             false,
 *             source,
 *             node
 *         ),
 *     (locale, keySelector) => {
 *         if (typeof locale !== "string") throw new Error("locale must be a string");
 *         if (typeof keySelector !== "function") throw new Error("keySelector must be a function");
 *     }
 * );
 * ```
 *
 * @group Utilities
 */
export function createOrderedOperator<TSource, TArgs extends unknown[]>(
    name: string,
    category: OperatorKind,
    factory: (source: TyneqOrderedEnumerable<TSource, unknown>, node: QueryPlanNode, ...args: TArgs) => TyneqOrderedSequence<TSource>,
    validate?: (...args: TArgs) => void
): void {
    OperatorRegistry.register({
        metadata: new OperatorMetadata(name, category, "external", TyneqOrderedEnumerable),
        impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
            validate?.(...(userArgs as TArgs));
            const source = this as unknown as TyneqOrderedEnumerable<TSource, unknown>;
            const node = new QueryNode(name, userArgs, source[tyneqQueryNode], category as OperatorCategory);
            return factory(source, node, ...(userArgs as TArgs));
        }
    });
}
