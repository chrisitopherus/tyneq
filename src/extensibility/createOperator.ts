import type { IEnumerable, IEnumerator, IEnumeratorFactory } from '../types/core';
import { TyneqEnumerableBase } from '../core/TyneqEnumerableBase';
import { OperatorRegistry } from './OperatorRegistry';
import { QueryNode } from '../queryplan/QueryNode';
import { tyneqQueryNode } from '../types/queryplan';
import type { IWithCreateEnumerable } from './_internal';

// Functional operator registration API
//
// Three levels of ceremony — pick the one that fits:
//
//   createTerminalOperator()    — terminal, returns a value
//   createOperator()            — streaming/buffer, returns ITyneqEnumerable
//   createGeneratorOperator()   — streaming, implemented as a generator function
//                                  (lowest ceremony, no class/constructor needed)
//
// All three route through OperatorRegistry.register().

/**
 * Defines and immediately registers a streaming or buffering operator on all
 * `TyneqEnumerable` instances without requiring a class.
 *
 * @remarks
 * Call this function at module level. Registration happens as a side-effect of
 * importing the file that contains the call.
 *
 * The `factory` receives the source enumerable and any user-provided arguments,
 * and must return an `IEnumeratorFactory<TResult>`.
 *
 * Declare user-facing argument types on the `factory` function. TypeScript infers
 * `TArgs` automatically, giving `validate` a fully-typed parameter list with no
 * extra annotations.
 *
 * @typeParam TArgs - Tuple of user-facing argument types (excluding the implicit source).
 *   Inferred from the `factory` signature — no explicit type parameter needed at the call site.
 *
 * @throws {Error} If a method named `config.name` is already registered.
 *
 * @group Utilities
 *
 * @example
 * ```ts
 * // window.ts — importing this file registers the operator
 * import { createOperator } from '../extensibility/createOperator';
 *
 * createOperator({
 *     name: 'window',
 *     factory(source: IEnumerable<unknown>, size: number) {
 *         return {
 *             getEnumerator() {
 *                 return windowGenerator(source[Symbol.iterator](), size) as unknown as IEnumerator<unknown>;
 *             }
 *         };
 *     },
 *     validate(size) {  // size: number — inferred, no annotation needed
 *         ArgumentUtility.checkPositive({ size });
 *     }
 * });
 * ```
 */
export function createOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    kind?: 'streaming' | 'buffer';
    factory: (source: IEnumerable<TSource>, ...args: TArgs) => IEnumeratorFactory<TResult>;
    validate?: (...args: NoInfer<TArgs>) => void;
}): void {
    const kind = config.kind ?? 'streaming';
    OperatorRegistry.register({
        metadata: { name: config.name, kind, source: 'internal' },
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            const withCreate = this as unknown as IWithCreateEnumerable;
            const node = new QueryNode(config.name, args, withCreate[tyneqQueryNode], kind);
            return withCreate.createEnumerable(
                config.factory(this as IEnumerable<TSource>, ...(args as TArgs)),
                node
            );
        }
    });
}

/**
 * Defines and immediately registers a streaming operator implemented as a
 * generator function — the lowest-ceremony way to define an operator.
 *
 * @remarks
 * The `generator` receives the source `Iterable<unknown>` and any user arguments,
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
 * import { createGeneratorOperator } from '../extensibility/createOperator';
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
}): void {
    OperatorRegistry.register({
        metadata: { name: config.name, kind: 'streaming', source: 'internal' },
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            const self = this;
            const withCreate = this as unknown as IWithCreateEnumerable;
            const node = new QueryNode(config.name, args, withCreate[tyneqQueryNode], 'streaming');
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

/**
 * Defines and immediately registers a terminal operator — one that evaluates
 * the sequence immediately and returns a concrete value (not another enumerable).
 *
 * @remarks
 * The `execute` function receives the source enumerable and any user arguments, and
 * returns the result value directly. It may enumerate the source partially or fully.
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
 * import { createTerminalOperator } from '../extensibility/createOperator';
 *
 * createTerminalOperator({
 *     name: 'joinString',
 *     execute(source: IEnumerable<unknown>, separator: string): string {
 *         const parts: string[] = [];
 *         for (const item of source) parts.push(String(item));
 *         return parts.join(separator);
 *     }
 * });
 *
 * // declare module 'tyneq' { interface ITyneqEnumerable<T> { joinString(sep: string): string; } }
 * Tyneq.from([1, 2, 3]).joinString(', '); // "1, 2, 3"
 * ```
 */
export function createTerminalOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    execute: (source: IEnumerable<TSource>, ...args: TArgs) => TResult;
    validate?: (...args: NoInfer<TArgs>) => void;
}): void {
    OperatorRegistry.register({
        metadata: { name: config.name, kind: 'terminal', source: 'internal' },
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            return config.execute(this as IEnumerable<TSource>, ...(args as TArgs));
        }
    });
}
