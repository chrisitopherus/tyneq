import type { Enumerable, EnumeratorFactory, OperatorSource } from "../../types/core";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import type { OperatorCategory } from "../../types/queryplan";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { OperatorMetadata } from "../../core/OperatorMetadata";
import { RegistrationUtility } from "../RegistrationUtility";

/**
 * Registers a streaming or buffering operator using a factory function.
 *
 * Use this when the operator requires a class-level enumerator with custom state
 * but you want to avoid writing the decorator boilerplate. For simpler generator-based
 * operators, prefer {@link createGeneratorOperator}.
 *
 * @param config.name - Method name to expose on every sequence.
 * @param config.category - `"streaming"` or `"buffer"`.
 * @param config.factory - Returns an `EnumeratorFactory` given the source and arguments.
 * @param config.validate - Optional eager validation for user-supplied arguments.
 *
 * @example
 * ```ts
 * import { createOperator } from "tyneq/plugin";
 * import type { Enumerator } from "tyneq";
 *
 * createOperator({
 *     name: "everyOther",
 *     category: "streaming",
 *     factory: <T>(source: Enumerable<T>) => ({
 *         getEnumerator(): Enumerator<T> {
 *             let skip = false;
 *             const iter = source[Symbol.iterator]();
 *             return {
 *                 next(): IteratorResult<T> {
 *                     while (true) {
 *                         const r = iter.next();
 *                         if (r.done) return r;
 *                         if (!skip) { skip = true; return r; }
 *                         skip = false;
 *                     }
 *                 }
 *             };
 *         }
 *     })
 * });
 * ```
 *
 * @group Factory Functions
 */
export function createOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    category: OperatorCategory;
    factory: (source: Enumerable<TSource>, ...args: TArgs) => EnumeratorFactory<TResult>;
    validate?: (...args: NoInfer<TArgs>) => void;
    source?: OperatorSource;
}): void {
    OperatorRegistry.register({
        metadata: OperatorMetadata.forCategory(config.category, config.name, TyneqEnumerableBase, config.source),
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            return RegistrationUtility.buildEnumerable(
                this,
                config.name,
                args,
                config.category,
                config.factory(this as Enumerable<TSource>, ...(args as TArgs)) as EnumeratorFactory<unknown>
            );
        }
    });
}
