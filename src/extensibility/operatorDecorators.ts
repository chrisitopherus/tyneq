import { TyneqEnumerableBase } from '../core/TyneqEnumerableBase';

/**
 * TC39 class decorator that registers a **streaming or buffering** operator on all
 * `TyneqEnumerable` instances by patching `TyneqEnumerableBase.prototype`.
 *
 * @remarks
 * The decorated class must:
 * - Extend `TyneqOperatorEnumerable<TSource, TResult>` (or implement `getEnumerator()`)
 * - Have a constructor with signature `(source: IEnumerable<TSource>, ...userArgs: TArgs)`
 *
 * Registration happens exactly once—when the class body is evaluated (i.e., when the
 * module containing the decorated class is first imported). Re-importing the same module
 * does not re-register because JS module evaluation is cached.
 *
 * ## How the injected method works
 *
 * ```text
 * user calls:   seq.scan(0, (a, b) => a + b)
 *                         └─ userArgs ──────┘
 *
 * injected fn:  new ScanOperatorEnumerable(seq, 0, (a, b) => a + b)
 *               └── source (=seq) is the first constructor arg ──────┘
 *
 * wrapped in:   this.createEnumerable(operatorInstance)
 *               └── preserves the concrete TyneqEnumerable subtype ──┘
 * ```
 *
 * @param name - The method name to register on `TyneqEnumerableBase.prototype`.
 *
 * @example — Registering a library-grade streaming operator
 * ```ts
 * \@operator('scan')
 * export class ScanOperatorEnumerable<TSource, TResult>
 *     extends TyneqOperatorEnumerable<TSource, TResult> {
 *
 *     constructor(source: IEnumerable<TSource>, seed: TResult, acc: (a: TResult, b: TSource) => TResult) {
 *         super(source);
 *         // ...
 *     }
 *     getEnumerator() { return new ScanEnumerator(...); }
 * }
 * // That's it — no call in TyneqEnumerableBase, no manual prototype assignment.
 * ```
 *
 * @example — How the existing `where` operator *would* look with this decorator
 * ```ts
 * // ── BEFORE (requires TyneqEnumerableBase to know about WhereOperatorEnumerable) ──
 * // In TyneqEnumerableBase.ts:
 * //   import { WhereOperatorEnumerable } from '../operators/streaming/where';
 * //   public where(...) { return this.createEnumerable(new WhereOperatorEnumerable(this, pred)); }
 *
 * // ── AFTER (self-contained, zero changes to base class) ──
 * \@operator('where')
 * export class WhereOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
 *     constructor(source, private predicate: (item: TSource) => boolean) { super(source); }
 *     getEnumerator() { return new WhereEnumerator(this.source[Symbol.iterator](), this.predicate); }
 * }
 * ```
 */
export function operator(name: string) {
    return function <TClass extends new (...args: any[]) => any>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        const proto = TyneqEnumerableBase.prototype as any;

        if (Object.prototype.hasOwnProperty.call(proto, name)) {
            throw new Error(
                `[tyneq] @operator('${name}'): a method named '${name}' is already defined on ` +
                `TyneqEnumerableBase.prototype. Use a different name or check for duplicate registrations.`
            );
        }

        proto[name] = function (this: TyneqEnumerableBase<any>, ...userArgs: any[]) {
            // 'this' is the sequence instance; we inject it as first constructor arg.
            // createEnumerable() is protected on TyneqEnumerableBase but accessible at runtime.
            return (this as any).createEnumerable(new target(this, ...userArgs));
        };

        return target;
    };
}

/**
 * TC39 class decorator that registers a **terminal** operator on all `TyneqEnumerable`
 * instances by patching `TyneqEnumerableBase.prototype`.
 *
 * @remarks
 * The decorated class must:
 * - Extend `TyneqTerminalOperator<TSource, TResult>`
 * - Have a constructor with signature `(source: IEnumerable<TSource>, ...userArgs: TArgs)`
 * - Implement `process(): TResult`
 *
 * The injected method calls `new DecoratedClass(seq, ...userArgs).process()` automatically.
 *
 * @param name - The method name to register on `TyneqEnumerableBase.prototype`.
 *
 * @example — Registering a terminal operator
 * ```ts
 * \@terminal('minMax')
 * export class MinMaxOperator<T> extends TyneqTerminalOperator<T, MinMaxResult<T>> {
 *     constructor(source: IEnumerable<T>, comparer?: (a: T, b: T) => number) {
 *         super(source);
 *         // ...
 *     }
 *     process(): MinMaxResult<T> { ... }
 * }
 * // seq.minMax() now works on every ITyneqEnumerable
 * ```
 *
 * @example — How the existing `count` operator *would* look with this decorator
 * ```ts
 * // ── BEFORE ──
 * // In TyneqEnumerableBase.ts:
 * //   import { CountOperator } from '../operators/terminal/count';
 * //   public count(): number { return new CountOperator(this).process(); }
 *
 * // ── AFTER ──
 * \@terminal('count')
 * export class CountOperator<T> extends TyneqTerminalOperator<T, number> {
 *     constructor(source: IEnumerable<T>) { super(source); }
 *     process(): number {
 *         if (Array.isArray(this.source)) return (this.source as T[]).length;
 *         let n = 0; for (const _ of this.source) n++; return n;
 *     }
 * }
 * ```
 */
export function terminal(name: string) {
    return function <TClass extends new (...args: any[]) => { process(): any }>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        const proto = TyneqEnumerableBase.prototype as any;

        if (Object.prototype.hasOwnProperty.call(proto, name)) {
            throw new Error(
                `[tyneq] @terminal('${name}'): a method named '${name}' is already defined on ` +
                `TyneqEnumerableBase.prototype. Use a different name or check for duplicate registrations.`
            );
        }

        proto[name] = function (this: TyneqEnumerableBase<any>, ...userArgs: any[]) {
            return new target(this, ...userArgs).process();
        };

        return target;
    };
}
