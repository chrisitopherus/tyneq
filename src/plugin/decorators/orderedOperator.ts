import { OperatorMetadata } from "../../core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { TyneqOrderedEnumerable } from "../../core/ordering/TyneqOrderedEnumerable";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { QueryNode } from "../../queryplan/QueryNode";
import { ISequenceFactory } from "../../types/core";
import type { OperatorCategory } from "../../types/queryplan";
import { tyneqQueryNode } from "../../types/queryplan";
import { Constructor } from "../../types/utility";

/**
 * Class decorator that registers a `TyneqOrderedEnumerator` subclass as an operator
 * available only on ordered sequences.
 *
 * The enumerator constructor receives the full `TyneqOrderedEnumerable` as its first
 * argument (not just an `Enumerator<T>`).
 *
 * @param name - Method name to expose on ordered sequences.
 * @param category - Operator kind (`"streaming"` | `"buffer"`).
 * @param validate - Optional eager validation function for user-supplied arguments.
 *
 * @example
 * ```ts
 * @orderedOperator("myThenBy", "buffer", (keySelector) => {
 *     if (typeof keySelector !== "function") throw new Error("keySelector must be a function");
 * })
 * class MyThenByEnumerator<T> extends TyneqOrderedEnumerator<T> {
 *     constructor(source: OrderedEnumerable<T>, private keySelector: (item: T) => unknown) {
 *         super(source);
 *     }
 *     protected handleNext(): IteratorResult<T> { ... }
 * }
 * ```
 *
 * @group Decorators
 */
export function orderedOperator<TArgs extends unknown[] = never>(
    name: string,
    category: OperatorCategory,
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends Constructor<any>>(target: TClass, _context: ClassDecoratorContext<TClass>): TClass {
        OperatorRegistry.register({
            metadata: new OperatorMetadata(name, category, "external", TyneqOrderedEnumerable),
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                const base = this as unknown as TyneqOrderedEnumerable<unknown, unknown>;
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
