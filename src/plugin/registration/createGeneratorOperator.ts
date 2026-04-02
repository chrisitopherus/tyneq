import type { Enumerator, EnumeratorFactory, ISequenceFactory, OperatorSource } from "../../types/core";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { QueryNode } from "../../queryplan/QueryNode";
import type { OperatorCategory } from "../../types/queryplan";
import { tyneqQueryNode } from "../../types/queryplan";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { OperatorMetadata } from "../../core/OperatorMetadata";

/**
 * Registers a streaming or buffering operator using a generator function.
 *
 * The generator receives the source as an `Iterable<T>` and any user arguments.
 * For streaming operators, yield elements one at a time as they are consumed.
 * For buffering operators, collect all input first and then yield the results.
 * For class-based enumerators with custom state, prefer {@link createOperator}.
 *
 * @param config.name - Method name to expose on every sequence.
 * @param config.category - `"streaming"` or `"buffer"`.
 * @param config.generator - Generator that yields transformed elements from `source`.
 * @param config.validate - Optional eager validation for user-supplied arguments.
 *
 * @example
 * ```ts
 * import { createGeneratorOperator } from "tyneq/plugin";
 *
 * createGeneratorOperator({
 *     name: "everyOther",
 *     category: "streaming",
 *     *generator(source) {
 *         let skip = false;
 *         for (const item of source) {
 *             if (!skip) yield item;
 *             skip = !skip;
 *         }
 *     }
 * });
 * ```
 *
 * @group Utilities
 */
export function createGeneratorOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    category: OperatorCategory;
    generator: (source: Iterable<TSource>, ...args: TArgs) => IterableIterator<TResult>;
    validate?: (...args: NoInfer<TArgs>) => void;
    source?: OperatorSource;
}): void {
    OperatorRegistry.register({
        metadata: new OperatorMetadata(config.name, config.category, config.source ?? "external", TyneqEnumerableBase),
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            const withCreate = this as unknown as ISequenceFactory<unknown>;
            const node = new QueryNode(config.name, args, withCreate[tyneqQueryNode], config.category);
            const source = this as unknown as Iterable<TSource>;
            return withCreate.createEnumerable({
                // IterableIterator<T> is structurally compatible with Enumerator<T>
                getEnumerator: (): Enumerator<unknown> =>
                    config.generator(source, ...(args as TArgs)) as unknown as Enumerator<unknown>
            } satisfies EnumeratorFactory<unknown>, node);
        }
    });
}
