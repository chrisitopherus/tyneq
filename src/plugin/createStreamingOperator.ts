import type { Enumerator, EnumeratorFactory, IWithCreateEnumerable } from "../types/core";
import { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";
import { QueryNode } from "../queryplan/QueryNode";
import { tyneqQueryNode } from "../types/queryplan";
import { OperatorRegistry } from "../core/registry/TyneqOperatorRegistry";
import { OperatorMetadata } from "../core/OperatorMetadata";

/**
 * Registers a streaming operator using a generator function.
 *
 * The simplest registration API for streaming operators. The generator receives
 * the source as an `Iterable<T>` and any user arguments; yield elements one at a time.
 *
 * @param config.name - Method name to expose on every sequence.
 * @param config.generator - Generator that yields transformed elements from `source`.
 * @param config.validate - Optional eager validation for user-supplied arguments.
 *
 * @example
 * ```ts
 * import { createStreamingOperator } from "tyneq/plugin";
 *
 * createStreamingOperator({
 *     name: "everyOther",
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
export function createStreamingOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    generator: (source: Iterable<TSource>, ...args: TArgs) => IterableIterator<TResult>;
    validate?: (...args: NoInfer<TArgs>) => void;
    source?: "internal" | "external";
}): void {
    OperatorRegistry.register({
        metadata: OperatorMetadata.streaming(config.name, TyneqEnumerableBase, config.source ?? "external"),
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            const self = this;
            const withCreate = this as unknown as IWithCreateEnumerable;
            const node = new QueryNode(config.name, args, withCreate[tyneqQueryNode], "streaming");
            return withCreate.createEnumerable({
                getEnumerator(): Enumerator<unknown> {
                    // IterableIterator<T> is structurally compatible with Enumerator<T>
                    return config.generator(
                        self as Iterable<TSource>,
                        ...(args as TArgs)
                    ) as unknown as Enumerator<unknown>;
                }
            } satisfies EnumeratorFactory<unknown>, node);
        }
    });
}
