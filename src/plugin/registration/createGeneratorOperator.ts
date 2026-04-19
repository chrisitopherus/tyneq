import type { Enumerator, EnumeratorFactory, OperatorSource } from "../../types/core";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { OperatorMetadata } from "../../core/OperatorMetadata";
import { RegistrationUtility } from "../RegistrationUtility";

/**
 * Registers an operator using a generator function.
 *
 * The generator receives the source as an `Iterable<T>` and any user arguments.
 * This is the simplest functional registration path and works for both streaming
 * and buffering use cases:
 *
 * - **Streaming**: yield elements one at a time as they arrive. The downstream
 *   sequence only pulls the next element when needed.
 * - **Buffering**: collect all input first, then yield the transformed output.
 *   Pass `category: "buffer"` to tell the query plan that this operator
 *   materialises the entire upstream before yielding.
 *
 * For class-based enumerators with custom stateful logic, prefer {@link createOperator}.
 *
 * @param config.name - Method name to expose on every sequence.
 * @param config.category - `"streaming"` (default) or `"buffer"`.
 * @param config.generator - Generator that yields transformed elements from `source`.
 * @param config.validate - Optional eager validation for user-supplied arguments.
 *
 * @example Streaming -- yield elements lazily one at a time:
 * ```ts
 * import { createGeneratorOperator } from "tyneq/plugin";
 *
 * createGeneratorOperator({
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
 * @example Buffering -- materialise the entire input first, then yield results:
 * ```ts
 * import { createGeneratorOperator } from "tyneq/plugin";
 *
 * createGeneratorOperator({
 *     name: "sortedBy",
 *     category: "buffer",
 *     *generator(source, keyFn: (x: number) => number) {
 *         const items = [...source].sort((a, b) => keyFn(a) - keyFn(b));
 *         for (const item of items) yield item;
 *     }
 * });
 * ```
 *
 * @group Factory Functions
 */
export function createGeneratorOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    category?: "streaming" | "buffer";
    generator: (source: Iterable<TSource>, ...args: TArgs) => IterableIterator<TResult>;
    validate?: (...args: NoInfer<TArgs>) => void;
    source?: OperatorSource;
}): void {
    const category = config.category ?? "streaming";
    OperatorRegistry.register({
        metadata: OperatorMetadata.forCategory(category, config.name, TyneqEnumerableBase, config.source),
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            const source = this as unknown as Iterable<TSource>;
            return RegistrationUtility.buildEnumerable(this, config.name, args, category, {
                // IterableIterator<T> is structurally compatible with Enumerator<T>
                getEnumerator: (): Enumerator<unknown> =>
                    config.generator(source, ...(args as TArgs)) as unknown as Enumerator<unknown>
            } satisfies EnumeratorFactory<unknown>);
        }
    });
}
