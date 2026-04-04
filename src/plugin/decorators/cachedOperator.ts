import { OperatorMetadata } from "../../core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { TyneqCachedEnumerable } from "../../core/TyneqCachedEnumerable";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { QueryNode } from "../../queryplan/QueryNode";
import { ISequenceFactory } from "../../types/core";
import type { OperatorCategory } from "../../types/queryplan";
import { tyneqQueryNode } from "../../types/queryplan";
import { Constructor } from "../../types/utility";

/**
 * Class decorator that registers a `TyneqCachedEnumerator` subclass as an operator
 * available only on cached sequences.
 *
 * The enumerator constructor receives the full `TyneqCachedEnumerable` as its first
 * argument (not just an `Enumerator<T>`).
 *
 * @param name - Method name to expose on cached sequences.
 * @param category - Operator kind (`"streaming"` | `"buffer"`).
 * @param validate - Optional eager validation function for user-supplied arguments.
 *
 * @example
 * ```ts
 * import { cachedOperator, TyneqCachedEnumerator } from "tyneq/plugin";
 *
 * @cachedOperator("myRefresh", "buffer")
 * class MyRefreshEnumerator<T> extends TyneqCachedEnumerator<T> {
 *     protected handleNext(): IteratorResult<T> {
 *         // this.cachedSource gives access to the full CachedEnumerable
 *         return this.cachedSource.getEnumerator().next();
 *     }
 * }
 * ```
 *
 * @group Decorators
 */
export function cachedOperator<TArgs extends unknown[] = never>(
    name: string,
    category: OperatorCategory,
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends Constructor<any>>(target: TClass, _context: ClassDecoratorContext<TClass>): TClass {
        OperatorRegistry.register({
            metadata: new OperatorMetadata(name, category, "external", TyneqCachedEnumerable),
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                // TypeScript cannot narrow 'this' inside a decorator-generated closure — cast is necessary
                const base = this as unknown as TyneqCachedEnumerable<unknown>;
                const withCreate = this as unknown as ISequenceFactory<unknown>;
                const node = new QueryNode(name, userArgs, withCreate[tyneqQueryNode], category);
                return withCreate.createEnumerable({
                    getEnumerator: () => new target(base, ...userArgs)
                }, node);
            }
        });
        return target;
    };
}
