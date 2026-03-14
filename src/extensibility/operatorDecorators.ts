import { TyneqEnumerableBase } from '../core/TyneqEnumerableBase';
import { OperatorRegistry } from './OperatorRegistry';
import { inferOperatorKind } from './inferKind';
import { QueryNode } from '../queryplan/QueryNode';
import { tyneqQueryNode } from '../types/queryplan';
import type { IQueryNode } from '../types/queryplan';

/** Minimal structural interface used to call `createEnumerable` without `protected` access errors. */
interface IWithCreateEnumerable {
    createEnumerable(factory: { getEnumerator(): unknown }, node?: IQueryNode | null): unknown;
    readonly [tyneqQueryNode]: IQueryNode | null;
}

/**
 * TC39 class decorator that registers a streaming or buffering operator on all
 * `TyneqEnumerable` instances by patching `TyneqEnumerableBase.prototype`.
 *
 * @remarks
 * The decorated class must extend `TyneqEnumerator<TSource, TResult>` (streaming) or
 * `TyneqEnumerableEnumerator<TSource, TResult>` (buffering). Its constructor must have the
 * signature `(sourceEnumerator: IEnumerator<TSource>, ...userArgs: TArgs)`. The operator
 * `kind` is inferred automatically from the base class.
 *
 * Registration happens once when the module containing the decorated class is first imported.
 *
 * Pass a `TArgs` type parameter to get a fully-typed `validate` body. Use `unknown` for
 * each argument — validation is a runtime defensive boundary, not a type-safe transform.
 * `unknown` forces explicit narrowing inside the validate body.
 *
 * The injected method calls `validate(…userArgs)` eagerly at the call site (before the lazy
 * factory is created), then wraps a `getEnumerator()` factory in `this.createEnumerable()`.
 *
 * When `TArgs` is omitted (default `never`), the validate parameter must also be omitted.
 *
 * @typeParam TArgs - Tuple of user-facing argument types (excluding the implicit source
 *   enumerator). Default `never` — use when the operator takes no user arguments.
 *
 * @param name - The method name to register on `TyneqEnumerableBase.prototype`.
 * @param validate - Optional function called synchronously at the call site before the lazy
 *   factory is created. Throw here to enforce eager argument validation.
 *
 * @throws {Error} If a method named `name` is already registered.
 * @throws {Error} If the decorated class does not extend `TyneqEnumerator` or
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
                const node = new QueryNode(name, userArgs, withCreate[tyneqQueryNode], kind === 'streaming' ? 'streaming' : 'buffer');
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
 * TC39 class decorator that registers a terminal operator on all `TyneqEnumerable`
 * instances by patching `TyneqEnumerableBase.prototype`.
 *
 * @remarks
 * The decorated class must extend `TyneqTerminalOperator<TSource, TResult>`, have a constructor
 * with signature `(source: IEnumerable<TSource>, ...userArgs: TArgs)`, and implement
 * `process(): TResult`. The injected method calls `new DecoratedClass(seq, …userArgs).process()`.
 *
 * Pass a `TArgs` type parameter to get a fully-typed `validate` body. Validation runs eagerly
 * at the call site before the operator class is instantiated.
 *
 * @typeParam TArgs - Tuple of user-facing argument types (excluding the implicit source).
 *   Default `never` — use when the operator takes no user arguments.
 *
 * @param name - The method name to register on `TyneqEnumerableBase.prototype`.
 * @param validate - Optional function called synchronously at the call site before the
 *   operator is instantiated and `process()` is called.
 *
 * @throws {Error} If a method named `name` is already registered.
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
 *     constructor(source: IEnumerable<T>, index: number) { super(source); }
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
