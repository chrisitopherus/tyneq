import { OperatorMetadata } from "../../core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { TyneqOrderedEnumerable } from "../../core/ordering/TyneqOrderedEnumerable";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { OrderedEnumerable } from "../../types/core";
import { Constructor } from "../../types/utility";

/**
 * Class decorator that registers a `TyneqOrderedTerminalOperator` subclass as a terminal
 * operator available only on ordered sequences.
 *
 * The class constructor receives the full `OrderedEnumerable` as its first argument,
 * giving access to ordered-sequence members (comparers, parent chain, etc.).
 *
 * @param name - Method name to expose on ordered sequences.
 * @param validate - Optional eager validation function for user-supplied arguments.
 *
 * @example
 * ```ts
 * @orderedTerminal("isSorted")
 * class IsSortedOperator<T> extends TyneqOrderedTerminalOperator<T, boolean> {
 *     process(): boolean {
 *         const items = [...this.source];
 *         for (let i = 1; i < items.length; i++) {
 *             if (this.source.comparer(items[i - 1], items[i]) > 0) return false;
 *         }
 *         return true;
 *     }
 * }
 * ```
 *
 * @group Decorators
 */
export function orderedTerminal<TArgs extends unknown[] = never>(
    name: string,
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends Constructor<{ process(): unknown }>>(
        target: TClass,
        _context: ClassDecoratorContext<TClass>
    ): TClass {
        OperatorRegistry.register({
            metadata: new OperatorMetadata(name, "terminal", "external", TyneqOrderedEnumerable),
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                const source = this as unknown as OrderedEnumerable<unknown>;
                return new target(source, ...userArgs).process();
            }
        });
        return target;
    };
}
