import { TyneqEnumerableBase } from '../core/TyneqEnumerableBase';
import type { IEnumerable, IEnumerator, IEnumeratorFactory } from '../types/core';

// ─────────────────────────────────────────────────────────────────────────────
// Functional operator registration API
//
// Three levels of ceremony — pick the one that fits:
//
//   createTerminalOperator()    — terminal, returns a value
//   createOperator()            — streaming/buffer, returns ITyneqEnumerable
//   createGeneratorOperator()   — streaming, implemented as a generator function
//                                  (lowest ceremony, no class/constructor needed)
// ─────────────────────────────────────────────────────────────────────────────

// ── Internal helper ──────────────────────────────────────────────────────────

function registerOnProto(name: string, fn: (this: TyneqEnumerableBase<any>, ...args: any[]) => any): void {
    const proto = TyneqEnumerableBase.prototype as any;

    if (Object.prototype.hasOwnProperty.call(proto, name)) {
        throw new Error(
            `[tyneq] createOperator/createTerminalOperator('${name}'): a method named '${name}' is ` +
            `already defined on TyneqEnumerableBase.prototype. ` +
            `Use a different name or check for duplicate registrations.`
        );
    }

    proto[name] = fn;
}

// ── createOperator() ─────────────────────────────────────────────────────────

/**
 * Defines and **immediately registers** a streaming or buffering operator on all
 * `TyneqEnumerable` instances without requiring a class.
 *
 * @remarks
 * Call this function at module level. Registration happens as a side-effect of
 * importing the file that contains the call.
 *
 * The `factory` receives the source enumerable and any user-provided arguments, and
 * must return an `IEnumeratorFactory<TResult>` (any object with `getEnumerator()`).
 *
 * @typeParam TSource - Element type of the source sequence.
 * @typeParam TResult - Element type of the result sequence.
 * @typeParam TArgs   - Tuple of argument types the operator accepts (beyond `source`).
 *
 * @example
 * ```ts
 * // window.ts — importing this file registers the operator
 * import { createOperator } from '../extensibility/createOperator';
 *
 * createOperator<any, any[], [number]>({
 *     name: 'window',
 *     factory(source, size: number) {
 *         return {
 *             getEnumerator() {
 *                 return windowGenerator(source[Symbol.iterator](), size) as any;
 *             }
 *         };
 *     }
 * });
 * ```
 */
export function createOperator<TSource = any, TResult = any, TArgs extends any[] = any[]>(config: {
    name: string;
    factory: (source: IEnumerable<TSource>, ...args: TArgs) => IEnumeratorFactory<TResult>;
}): void {
    registerOnProto(config.name, function (this: TyneqEnumerableBase<TSource>, ...args: TArgs) {
        const factory = config.factory(this as unknown as IEnumerable<TSource>, ...args);
        return (this as any).createEnumerable(factory);
    });
}

// ── createGeneratorOperator() ────────────────────────────────────────────────

/**
 * Defines and **immediately registers** a streaming operator implemented as a
 * generator function — the lowest-ceremony way to define an operator.
 *
 * @remarks
 * The `generator` receives the source `Iterable<TSource>` and any user arguments,
 * and `yield`s result elements. The library wraps the generator in the standard
 * `IEnumeratorFactory` pattern automatically.
 *
 * Because `for…of` works on any `Iterable`, you can iterate `source` directly in
 * the generator body without calling `[Symbol.iterator]()` manually.
 *
 * Registration happens as a side-effect of importing the file.
 *
 * @typeParam TSource - Element type of the source sequence.
 * @typeParam TResult - Element type of the result sequence.
 * @typeParam TArgs   - Tuple of argument types the operator accepts (beyond `source`).
 *
 * @example
 * ```ts
 * // intersperse.ts
 * import { createGeneratorOperator } from '../extensibility/createOperator';
 *
 * createGeneratorOperator<any, any, [any]>({
 *     name: 'intersperse',
 *     *generator(source, delimiter) {
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
export function createGeneratorOperator<TSource = any, TResult = any, TArgs extends any[] = any[]>(config: {
    name: string;
    generator: (source: Iterable<TSource>, ...args: TArgs) => IterableIterator<TResult>;
}): void {
    registerOnProto(config.name, function (this: TyneqEnumerableBase<TSource>, ...args: TArgs) {
        const self = this;
        return (this as any).createEnumerable({
            getEnumerator(): IEnumerator<TResult> {
                // IterableIterator<T> is structurally compatible with IEnumerator<T>
                return config.generator(self as unknown as Iterable<TSource>, ...args) as unknown as IEnumerator<TResult>;
            }
        } satisfies IEnumeratorFactory<TResult>);
    });
}

// ── createTerminalOperator() ─────────────────────────────────────────────────

/**
 * Defines and **immediately registers** a terminal operator — one that evaluates
 * the sequence immediately and returns a concrete value (not another enumerable).
 *
 * @remarks
 * The `execute` function receives the source enumerable and any user arguments, and
 * returns the result value directly. It may enumerate the source partially or fully.
 *
 * @typeParam TSource - Element type of the source sequence.
 * @typeParam TResult - The concrete result type returned by the operator.
 * @typeParam TArgs   - Tuple of argument types the operator accepts (beyond `source`).
 *
 * @example
 * ```ts
 * import { createTerminalOperator } from '../extensibility/createOperator';
 *
 * createTerminalOperator<number, string, [string]>({
 *     name: 'joinString',
 *     execute(source, separator) {
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
export function createTerminalOperator<TSource = any, TResult = any, TArgs extends any[] = any[]>(config: {
    name: string;
    execute: (source: IEnumerable<TSource>, ...args: TArgs) => TResult;
}): void {
    registerOnProto(config.name, function (this: TyneqEnumerableBase<TSource>, ...args: TArgs) {
        return config.execute(this as unknown as IEnumerable<TSource>, ...args);
    });
}
