import type { Enumerable } from "../types/core";
import { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";
import { OperatorRegistry, OperatorMetadata } from "./OperatorRegistry";

/**
 * Defines and immediately registers a terminal operator — one that evaluates
 * the sequence immediately and returns a concrete value (not another enumerable).
 *
 * @remarks
 * The `execute` function receives the source enumerable and any user arguments, and
 * returns the result value directly. It may enumerate the source partially or fully.
 *
 * Registration happens as a side-effect of importing the file.
 *
 * Declare user-facing argument types on the `execute` function. TypeScript infers
 * `TArgs` automatically, giving `validate` a fully-typed parameter list.
 *
 * @typeParam TArgs - Tuple of user-facing argument types (excluding the implicit source).
 *   Inferred from the `execute` signature — no explicit type parameter needed at the call site.
 *
 * @throws {Error} If a method named `config.name` is already registered.
 *
 * @group Utilities
 *
 * @example
 * ```ts
 * import { createTerminalOperator } from 'tyneq/extensions';
 *
 * createTerminalOperator({
 *     name: 'joinString',
 *     execute(source: Enumerable<unknown>, separator: string): string {
 *         const parts: string[] = [];
 *         for (const item of source) parts.push(String(item));
 *         return parts.join(separator);
 *     }
 * });
 *
 * // declare module 'tyneq' { interface TyneqSequence<T> { joinString(sep: string): string; } }
 * Tyneq.from([1, 2, 3]).joinString(', '); // "1, 2, 3"
 * ```
 */
export function createTerminalOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    execute: (source: Enumerable<TSource>, ...args: TArgs) => TResult;
    validate?: (...args: NoInfer<TArgs>) => void;
    /** @internal */
    source?: "internal" | "external";
}): void {
    OperatorRegistry.register({
        metadata: new OperatorMetadata(config.name, "terminal", config.source ?? "external"),
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            return config.execute(this as Enumerable<TSource>, ...(args as TArgs));
        }
    });
}
