import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import type { OperatorCategory } from "../../types/queryplan";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { OperatorMetadata } from "../../core/OperatorMetadata";
import { PluginError } from "../../core/errors/PluginError";
import { ReflectionUtility } from "../../utility/ReflectionUtility";
import { RegistrationUtility } from "../RegistrationUtility";

/**
 * Class decorator that registers a `TyneqEnumerator` subclass as an operator on every sequence.
 *
 * Validation runs eagerly at the call site, before the lazy enumerator is created.
 *
 * @param name - Method name to expose on every sequence.
 * @param category - Operator kind (`"streaming"` | `"buffer"`).
 * @param validate - Optional eager validation function for user-supplied arguments.
 *
 * @example
 * ```ts
 * import { operator, TyneqEnumerator } from "tyneq/plugin";
 * import type { Enumerator } from "tyneq";
 *
 * @operator<[predicate: (item: unknown) => boolean]>("myFilter", "streaming", (predicate) => {
 *     if (typeof predicate !== "function") throw new Error("predicate must be a function");
 * })
 * class MyFilterEnumerator<T> extends TyneqEnumerator<T> {
 *     constructor(source: Enumerator<T>, private readonly predicate: (item: T) => boolean) {
 *         super(source);
 *     }
 *     protected handleNext(): IteratorResult<T> {
 *         while (true) {
 *             const next = this.sourceEnumerator.next();
 *             if (next.done || this.predicate(next.value)) return next;
 *         }
 *     }
 * }
 * ```
 *
 * @group Decorators
 */
export function operator<TArgs extends unknown[] = never>(
    name: string,
    category: "streaming" | "buffer",
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends new (...args: any[]) => any>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        if (!ReflectionUtility.hasMethod(target.prototype, "handleNext")) {
            throw new PluginError(
                `@operator("${name}"): class "${target.name}" must define a protected handleNext(): IteratorResult<T> method. `
                + "Ensure the class extends TyneqEnumerator<TInput, TOutput>.",
                "operator",
                target.name
            );
        }

        OperatorRegistry.register({
            metadata: OperatorMetadata.forCategory(category, name, TyneqEnumerableBase),
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                const base = this;
                return RegistrationUtility.buildEnumerable(this, name, userArgs, category, {
                    getEnumerator() {
                        return new target(base.getEnumerator(), ...userArgs);
                    }
                });
            }
        });
        return target;
    };
}
