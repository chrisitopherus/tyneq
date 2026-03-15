import { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";
import { OperatorRegistry } from "./OperatorRegistry";

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
 *     public constructor(source: IEnumerable<T>) { super(source); }
 *     public process(): number {
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
 *     public constructor(source: IEnumerable<T>, private readonly index: number) { super(source); }
 *     public process(): T { ... }
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
                kind: "terminal",
                source: "internal",
            },
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                return new target(this, ...userArgs).process();
            }
        });
        return target;
    };
}
