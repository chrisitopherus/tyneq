import { TyneqEnumerableBase } from '../core/TyneqEnumerableBase';

/**
 * TC39 class decorator that registers a **streaming or buffering** operator on all
 * `TyneqEnumerable` instances by patching `TyneqEnumerableBase.prototype`.
 *
 * @remarks
 * The decorated class must be an **enumerator** (not a wrapper enumerable):
 * - Extend `TyneqEnumerator<TSource, TResult>` or `TyneqBaseEnumerator<TResult>`
 * - Have a constructor with signature `(sourceEnumerator: IEnumerator<TSource>, ...userArgs: TArgs)`
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
 * injected fn:  validate(0, (a, b) => a + b)   ← throws here if invalid (eager)
 *               {
 *                 getEnumerator() {
 *                   return new ScanEnumerator(seq.getEnumerator(), 0, (a, b) => a + b)
 *                 }
 *               }
 *               └── fresh IEnumerator created per iteration ──┘
 *
 * wrapped in:   this.createEnumerable(factory)
 *               └── preserves the concrete TyneqEnumerable subtype ──┘
 * ```
 *
 * @param name     - The method name to register on `TyneqEnumerableBase.prototype`.
 * @param validate - Optional function called **synchronously at the call site** before
 *                   the lazy factory is created. Receives the same user-facing arguments
 *                   as the operator method (excluding the implicit source). Throw from
 *                   here to enforce the LINQ convention of eager argument validation.
 *
 * @throws {Error} When a method named `name` is already defined on
 *   `TyneqEnumerableBase.prototype`.
 *
 * @group Decorators
 *
 * @example
 * Registering a streaming operator directly on the enumerator class:
 * ```ts
 * \@operator('where')
 * export class WhereEnumerator<T> extends TyneqEnumerator<T> {
 *     constructor(source: IEnumerator<T>, private predicate: (item: T) => boolean) {
 *         super(source);
 *     }
 *     protected handleNext(): IteratorResult<T> { ... }
 * }
 * // That's it — no wrapper class, no changes to TyneqEnumerableBase.
 * ```
 *
 * @example
 * Eager argument validation passed directly to the decorator:
 * ```ts
 * \@operator('scan', (_seed, accumulator) => {
 *     ArgumentUtility.checkNotOptional({ accumulator });
 * })
 * export class ScanEnumerator<TSource, TResult> extends TyneqEnumerator<TSource, TResult> {
 *     // ...
 * }
 * ```
 */
export function operator(name: string, validate?: (...userArgs: any[]) => void) {
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
            validate?.(...userArgs);
            const source = this;
            return (this as any).createEnumerable({
                getEnumerator() {
                    return new target(source.getEnumerator(), ...userArgs);
                }
            });
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
 * @throws {Error} When a method named `name` is already defined on
 *   `TyneqEnumerableBase.prototype`.
 *
 * @group Decorators
 *
 * @example
 * Registering a terminal operator:
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
 * @example
 * How the existing `count` operator would look with this decorator:
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
