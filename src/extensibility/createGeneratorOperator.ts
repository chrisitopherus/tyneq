import type { IEnumerator, IEnumeratorFactory } from "../types/core";
import { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";
import { OperatorRegistry, OperatorMetadata } from "./OperatorRegistry";
import { QueryNode } from "../queryplan/QueryNode";
import { tyneqQueryNode } from "../types/queryplan";
import type { IWithCreateEnumerable } from "./registrationShared";

/**
 * Defines and immediately registers a streaming operator implemented as a
 * generator function — the lowest-ceremony way to define an operator.
 *
 * @remarks
 * The `generator` receives the source `Iterable<TSource>` and any user arguments,
 * and `yield`s result elements. The library wraps the generator in the standard
 * `IEnumeratorFactory` pattern automatically.
 *
 * Registration happens as a side-effect of importing the file.
 *
 * Declare user-facing argument types on the `generator` function. TypeScript infers
 * `TArgs` automatically, giving `validate` a fully-typed parameter list.
 *
 * @typeParam TArgs - Tuple of user-facing argument types (excluding the implicit source).
 *   Inferred from the `generator` signature — no explicit type parameter needed at the call site.
 *
 * @throws {Error} If a method named `config.name` is already registered.
 *
 * @group Utilities
 *
 * @example
 * ```ts
 * // intersperse.ts
 * import { createGeneratorOperator } from '../extensibility/createGeneratorOperator';
 *
 * createGeneratorOperator({
 *     name: 'intersperse',
 *     *generator(source: Iterable<unknown>, delimiter: unknown) {
 *         let first = true;
 *         for (const item of source) {
 *             if (!first) yield delimiter;
 *             yield item;
 *             first = false;
 *         }
 *     }
 * });
 * ```
 */
export function createGeneratorOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    generator: (source: Iterable<TSource>, ...args: TArgs) => IterableIterator<TResult>;
    validate?: (...args: NoInfer<TArgs>) => void;
    /** @internal */
    source?: "internal" | "external";
}): void {
    OperatorRegistry.register({
        metadata: new OperatorMetadata(config.name, "streaming", config.source ?? "external"),
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            const self = this;
            const withCreate = this as unknown as IWithCreateEnumerable;
            const node = new QueryNode(config.name, args, withCreate[tyneqQueryNode], "streaming");
            return withCreate.createEnumerable({
                getEnumerator(): IEnumerator<unknown> {
                    // IterableIterator<T> is structurally compatible with IEnumerator<T>
                    return config.generator(
                        self as Iterable<TSource>,
                        ...(args as TArgs)
                    ) as unknown as IEnumerator<unknown>;
                }
            } satisfies IEnumeratorFactory<unknown>, node);
        }
    });
}
