import { TyneqEnumerableBase } from '../core/TyneqEnumerableBase';
import { OperatorRegistry } from './OperatorRegistry';
import { inferOperatorKind } from './inferKind';
import { QueryNode } from '../queryplan/QueryNode';
import type { IQueryNode } from '../queryplan/IQueryNode';

/** Minimal structural interface used to call `createEnumerable` without `protected` access errors. */
interface IWithCreateEnumerable {
    createEnumerable(factory: { getEnumerator(): unknown }, node?: IQueryNode | null): unknown;
    readonly queryNode: IQueryNode | null;
}

/**
 * TC39 class decorator that registers a **streaming or buffering** operator on all
 * `TyneqEnumerable` instances by patching `TyneqEnumerableBase.prototype`.
 *
 * @remarks
 * The decorated class must be an **enumerator** (not a wrapper enumerable):
 * - Extend `TyneqEnumerator<TSource, TResult>` (streaming) or
 *   `TyneqEnumerableEnumerator<TSource, TResult>` (buffer)
 * - Have a constructor with signature `(sourceEnumerator: IEnumerator<TSource>, ...userArgs: TArgs)`
 *
 * Registration happens exactly once — when the class body is evaluated (i.e., when the
 * module containing the decorated class is first imported). Re-importing the same module
 * does not re-register because JS module evaluation is cached.
 *
 * The `kind` (`'streaming'` or `'buffer'`) is **inferred automatically** from the base
 * class — no extra argument is needed.
 *
 * ## Typed Validation
 *
 * Pass a `TArgs` type parameter to get a fully-typed `validate` body. Use `unknown` for
 * each argument — validation is a runtime defensive boundary, not a type-safe transform.
 * `unknown` forces explicit narrowing inside the validate body, which is the correct contract.
 *
 * ```ts
 * // validate body is typed: (_seed: unknown, accumulator: unknown) => void
 * \@operator<[seed: unknown, accumulator: unknown]>('scan', (_seed, accumulator) => {
 *     ArgumentUtility.checkNotOptional({ accumulator });
 * })
 * ```
 *
 * When `TArgs` is omitted (default `never`), the validate parameter is typed as
 * `(...args: never[]) => void` and must also be omitted.
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
 * @typeParam TArgs - Tuple of user-facing argument types (excluding the implicit source
 *   enumerator). Default `never` — use when the operator takes no user arguments.
 *
 * @param name     - The method name to register on `TyneqEnumerableBase.prototype`.
 * @param validate - Optional function called **synchronously at the call site** before
 *                   the lazy factory is created. Receives the same user-facing arguments
 *                   as the operator method (excluding the implicit source). Throw from
 *                   here to enforce the LINQ convention of eager argument validation.
 *
 * @throws {Error} When a method named `name` is already registered.
 * @throws {Error} When the decorated class does not extend `TyneqEnumerator` or
 *   `TyneqEnumerableEnumerator` (kind cannot be inferred).
 *
 * @group Decorators
 *
 * @example
 * Registering a streaming operator with no user arguments:
 * ```ts
 * \@operator('where')
 * export class WhereEnumerator<T> extends TyneqEnumerator<T> {
 *     constructor(source: IEnumerator<T>, private predicate: (item: T) => boolean) {
 *         super(source);
 *     }
 *     protected handleNext(): IteratorResult<T> { ... }
 * }
 * ```
 *
 * @example
 * Eager typed validation:
 * ```ts
 * \@operator<[seed: unknown, accumulator: unknown]>('scan', (_seed, accumulator) => {
 *     ArgumentUtility.checkNotOptional({ accumulator });
 * })
 * export class ScanEnumerator<TSource, TResult> extends TyneqEnumerator<TSource, TResult> {
 *     constructor(source: IEnumerator<TSource>, seed: TResult, accumulator: ...) {
 *         super(source);
 *         // No validation here — moved to eager validate above
 *     }
 * }
 * ```
 */
export function operator<TArgs extends unknown[] = never>(
    name: string,
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends new (...args: any[]) => any>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        OperatorRegistry.register({
            metadata: {
                name,
                kind: inferOperatorKind(target),
            },
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                const base = this;
                const withCreate = this as unknown as IWithCreateEnumerable;
                const kind = inferOperatorKind(target);
                const node = new QueryNode(name, userArgs, withCreate.queryNode, kind === 'streaming' ? 'streaming' : 'buffer');
                return withCreate.createEnumerable({
                    getEnumerator() {
                        return new target(base.getEnumerator(), ...userArgs);
                    }
                }, node);
            }
        });
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
 * ## Typed Validation
 *
 * Pass a `TArgs` type parameter to get a fully-typed `validate` body. Validation runs
 * **eagerly at the call site**, before the operator class is instantiated — satisfying
 * the LINQ convention that argument errors should throw at query definition time.
 *
 * ```ts
 * // Before — validation was in constructor (lazy, only when iteration began)
 * \@terminal('first')
 * export class FirstOperator<T> extends TyneqTerminalOperator<T, T> {
 *     constructor(source: IEnumerable<T>, predicate: (item: T) => boolean) {
 *         super(source);
 *         ArgumentUtility.checkNotOptional({ predicate }); // ← lazy
 *     }
 * }
 *
 * // After — eager, typed
 * \@terminal<[(item: unknown) => boolean]>('first', (predicate) => {
 *     ArgumentUtility.checkNotOptional({ predicate });
 * })
 * export class FirstOperator<T> extends TyneqTerminalOperator<T, T> {
 *     constructor(source: IEnumerable<T>, predicate: (item: T) => boolean) {
 *         super(source);
 *         // No validation here
 *     }
 * }
 * ```
 *
 * @typeParam TArgs - Tuple of user-facing argument types (excluding the implicit source).
 *   Default `never` — use when the operator takes no user arguments.
 *
 * @param name     - The method name to register on `TyneqEnumerableBase.prototype`.
 * @param validate - Optional function called **synchronously at the call site** before
 *                   the operator is instantiated and `process()` is called.
 *
 * @throws {Error} When a method named `name` is already registered.
 *
 * @group Decorators
 *
 * @example
 * Registering a terminal operator with no user arguments:
 * ```ts
 * \@terminal('count')
 * export class CountOperator<T> extends TyneqTerminalOperator<T, number> {
 *     constructor(source: IEnumerable<T>) { super(source); }
 *     process(): number {
 *         if (Array.isArray(this.source)) return (this.source as T[]).length;
 *         let n = 0; for (const _ of this.source) n++; return n;
 *     }
 * }
 * ```
 *
 * @example
 * Eager typed validation on a terminal operator:
 * ```ts
 * \@terminal<[index: unknown]>('elementAt', (index) => {
 *     ArgumentUtility.checkNonNegative({ index });
 * })
 * export class ElementAtOperator<T> extends TyneqTerminalOperator<T, T> {
 *     constructor(source: IEnumerable<T>, index: number) {
 *         super(source);
 *         // No validation here — moved to eager validate above
 *     }
 *     process(): T { ... }
 * }
 * ```
 */
export function terminal<TArgs extends unknown[] = never>(
    name: string,
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends new (...args: any[]) => { process(): unknown }>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        OperatorRegistry.register({
            metadata: {
                name,
                kind: 'terminal',
            },
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                return new target(this, ...userArgs).process();
            }
        });
        return target;
    };
}
