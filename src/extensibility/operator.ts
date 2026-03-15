import { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";
import { OperatorRegistry } from "./OperatorRegistry";
import { inferOperatorKind } from "./inferKind";
import { QueryNode } from "../queryplan/QueryNode";
import { tyneqQueryNode } from "../types/queryplan";
import type { IWithCreateEnumerable } from "./registrationShared";

/**
 * TC39 class decorator that registers a streaming or buffering operator on all
 * `TyneqEnumerable` instances by patching `TyneqEnumerableBase.prototype`.
 *
 * @remarks
 * The decorated class must extend `TyneqEnumerator<TSource, TResult>`. Its constructor must
 * have the signature `(sourceEnumerator: IEnumerator<TSource>, ...userArgs: TArgs)`.
 *
 * **Kind resolution** — the `kind` is determined in this order:
 * 1. Explicit second argument (`'streaming'` or `'buffer'`). Preferred for buffer operators.
 * 2. Inferred from the prototype chain via `inferOperatorKind` when omitted.
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
 * @param kindOrValidate - Either an explicit `'streaming' | 'buffer'` kind, or the validate
 *   function when no explicit kind is needed (backward-compatible).
 * @param validate - Optional validate function; only used when `kindOrValidate` is a kind string.
 *
 * @throws {Error} If a method named `name` is already registered.
 * @throws {Error} If kind is omitted and cannot be inferred from the prototype chain.
 *
 * @group Decorators
 *
 * @example
 * Registering a streaming operator with no user arguments:
 * ```ts
 * \@operator('pairwise')
 * export class PairwiseEnumerator<T> extends TyneqEnumerator<T, [T, T]> {
 *     public constructor(source: IEnumerator<T>) { super(source); }
 *     protected handleNext(): IteratorResult<[T, T]> { ... }
 * }
 * ```
 *
 * @example
 * Registering a buffer operator with explicit kind:
 * ```ts
 * \@operator('reverse', 'buffer')
 * export class ReverseEnumerator<T> extends TyneqEnumerator<T> { ... }
 * ```
 *
 * @example
 * Eager typed validation with explicit kind:
 * ```ts
 * \@operator<[keySelector: unknown]>('distinctBy', 'buffer', (keySelector) => {
 *     ArgumentUtility.checkNotOptional({ keySelector });
 * })
 * export class DistinctByEnumerator<T, K> extends TyneqEnumerator<T> { ... }
 * ```
 *
 * @example
 * Eager typed validation (streaming, kind inferred):
 * ```ts
 * \@operator<[seed: unknown, accumulator: unknown]>('scan', (_seed, accumulator) => {
 *     ArgumentUtility.checkNotOptional({ accumulator });
 * })
 * export class ScanEnumerator<TSource, TResult> extends TyneqEnumerator<TSource, TResult> { ... }
 * ```
 */
export function operator<TArgs extends unknown[] = never>(
    name: string,
    kindOrValidate?: "streaming" | "buffer" | ((...args: TArgs) => void),
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends new (...args: any[]) => any>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        const kind: "streaming" | "buffer" = typeof kindOrValidate === "string"
            ? kindOrValidate
            : inferOperatorKind(target);
        const actualValidate: ((...args: TArgs) => void) | undefined =
            typeof kindOrValidate === "function" ? kindOrValidate : validate;
        OperatorRegistry.register({
            metadata: { name, kind, source: "internal" },
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                actualValidate?.(...(userArgs as TArgs));
                const base = this;
                const withCreate = this as unknown as IWithCreateEnumerable;
                const node = new QueryNode(name, userArgs, withCreate[tyneqQueryNode], kind);
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
