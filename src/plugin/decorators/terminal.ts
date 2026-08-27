import { OperatorMetadata } from "../../core/OperatorMetadata";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { PluginError } from "../../core/errors/PluginError";
import { reflect } from "../../utility/reflect";

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
 *     public process(): number {
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
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends new (...args: any[]) => { process(): unknown }>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        if (!reflect(target.prototype, { inherited: true }).hasMethod("process")) {
            throw new PluginError(
                `@terminal("${name}"): class "${target.name}" must define a public process(): TResult method. `
                + "Ensure the class extends TyneqTerminalOperator<TSource, TResult>.",
                "terminal",
                target.name
            );
        }

        OperatorRegistry.register({
            metadata: OperatorMetadata.terminal(name, TyneqEnumerableBase),
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                return new target(this, ...userArgs).process();
            }
        });
        return target;
    };
}
