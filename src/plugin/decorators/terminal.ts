import { OperatorMetadata } from "../../core/OperatorMetadata";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import type { OperatorCategory } from "../../types/queryplan";

/**
 * Class decorator that registers a class as a terminal operator.
 *
 * The class must have a `process()` method returning the result.
 * Validation runs eagerly at the call site before the class is instantiated.
 *
 * @param name - Method name to expose on every sequence.
 * @param validate - Optional eager validation function for user-supplied arguments.
 *
 * @example
 * ```ts
 * import { terminal } from "tyneq/plugin";
 * import { TyneqTerminalOperator } from "tyneq/plugin";
 * import type { Enumerable } from "tyneq";
 *
 * @terminal("product")
 * class ProductOperator extends TyneqTerminalOperator<number, number> {
 *     process(): number {
 *         let result = 1;
 *         for (const item of this.source) result *= item;
 *         return result;
 *     }
 * }
 * ```
 *
 * @group Decorators
 */
export function terminal<TArgs extends unknown[] = never>(
    name: string,
    category: OperatorCategory,
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends new (...args: any[]) => { process(): unknown }>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        OperatorRegistry.register({
            metadata: new OperatorMetadata(name, category, "external", TyneqEnumerableBase),
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                return new target(this, ...userArgs).process();
            }
        });
        return target;
    };
}
