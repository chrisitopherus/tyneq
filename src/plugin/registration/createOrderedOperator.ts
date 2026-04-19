import { OperatorMetadata } from "../../core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { TyneqOrderedEnumerable } from "../../core/ordering/TyneqOrderedEnumerable";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import type { OperatorSource, TyneqOrderedSequence } from "../../types/core";
import type { QueryPlanNode } from "../../types/queryplan";
import { RegistrationUtility } from "../RegistrationUtility";

/**
 * Registers a factory function as an operator available only on ordered sequences,
 * where the factory fully controls the return type.
 *
 * Use this when the operator must return a `TyneqOrderedSequence` (e.g. a `thenBy` variant).
 * The factory receives the ordered source and a query plan node. It is responsible for
 * constructing and returning the result sequence -- typically by instantiating
 * `TyneqOrderedEnumerable` directly.
 *
 * For operators that return a plain sequence from an enumerator class, use `@orderedOperator`.
 *
 * @param config.name - Method name to expose on ordered sequences.
 * @param config.category - Operator kind (`"streaming"` | `"buffer"`).
 * @param config.factory - Constructs the result sequence from `(source, node, ...userArgs)`.
 * @param config.validate - Optional eager validation function for user-supplied arguments.
 *
 * @example
 * ```ts
 * createOrderedOperator({
 *     name: "thenByLocale",
 *     category: "buffer",
 *     factory: (source, node, locale: string, keySelector: (item: unknown) => string) =>
 *         new TyneqOrderedEnumerable(
 *             source.source,
 *             keySelector,
 *             (a, b) => a.localeCompare(b, locale),
 *             false,
 *             source,
 *             node
 *         ),
 *     validate: (locale, keySelector) => {
 *         if (typeof locale !== "string") throw new Error("locale must be a string");
 *         if (typeof keySelector !== "function") throw new Error("keySelector must be a function");
 *     }
 * });
 * ```
 *
 * @group Factory Functions
 */
export function createOrderedOperator<TSource, TArgs extends unknown[]>(config: {
    name: string;
    category: "streaming" | "buffer";
    factory: (source: TyneqOrderedEnumerable<TSource, unknown>, node: QueryPlanNode, ...args: TArgs) => TyneqOrderedSequence<TSource>;
    validate?: (...args: NoInfer<TArgs>) => void;
    source?: OperatorSource;
}): void {
    OperatorRegistry.register({
        metadata: OperatorMetadata.forCategory(config.category, config.name, TyneqOrderedEnumerable, config.source),
        impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
            config.validate?.(...(userArgs as TArgs));
            const source = this as unknown as TyneqOrderedEnumerable<TSource, unknown>;
            const node = RegistrationUtility.buildQueryNode(this, config.name, userArgs, config.category);
            return config.factory(source, node, ...(userArgs as TArgs));
        }
    });
}
