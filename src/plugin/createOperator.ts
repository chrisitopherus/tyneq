import type { Enumerable, EnumeratorFactory, IWithCreateEnumerable } from "../types/core";
import { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";
import { QueryNode } from "../queryplan/QueryNode";
import { tyneqQueryNode } from "../types/queryplan";
import { OperatorRegistry } from "../core/registry/TyneqOperatorRegistry";
import { OperatorMetadata } from "../core/OperatorMetadata";

/**
 * Registers a streaming or buffering operator using a factory function.
 *
 * Use this when the operator requires a class-level enumerator with custom state
 * but you want to avoid writing the decorator boilerplate. For simpler generator-based
 * streaming operators, prefer {@link createStreamingOperator}.
 *
 * @param config.name - Method name to expose on every sequence.
 * @param config.kind - `"streaming"` (default) or `"buffer"`.
 * @param config.factory - Returns an `EnumeratorFactory` given the source and arguments.
 * @param config.validate - Optional eager validation for user-supplied arguments.
 *
 * @example
 * ```ts
 * import { createOperator } from "tyneq/plugin";
 *
 * createOperator({
 *     name: "everyOther",
 *     factory: (source) => ({
 *         getEnumerator() {
 *             let skip = false;
 *             const iter = source[Symbol.iterator]();
 *             return {
 *                 next() {
 *                     while (true) {
 *                         const r = iter.next();
 *                         if (r.done) return r;
 *                         if (!skip) { skip = true; return r; }
 *                         skip = false;
 *                     }
 *                 }
 *             } as any;
 *         }
 *     })
 * });
 * ```
 *
 * @group Utilities
 */
export function createOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    kind?: "streaming" | "buffer";
    factory: (source: Enumerable<TSource>, ...args: TArgs) => EnumeratorFactory<TResult>;
    validate?: (...args: NoInfer<TArgs>) => void;
    source?: "internal" | "external";
}): void {
    const kind = config.kind ?? "streaming";
    OperatorRegistry.register({
        metadata: new OperatorMetadata(config.name, kind, config.source ?? "external"),
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            const withCreate = this as unknown as IWithCreateEnumerable;
            const node = new QueryNode(config.name, args, withCreate[tyneqQueryNode], kind);
            return withCreate.createEnumerable(
                config.factory(this as Enumerable<TSource>, ...(args as TArgs)),
                node
            );
        }
    });
}
