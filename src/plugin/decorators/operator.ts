import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { QueryNode } from "../../queryplan/QueryNode";
import { tyneqQueryNode } from "../../types/queryplan";
import type { OperatorCategory } from "../../types/queryplan";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { OperatorMetadata } from "../../core/OperatorMetadata";
import { PluginError } from "../../core/errors/PluginError";
import { ReflectionUtility } from "../../utility/ReflectionUtility";
import { asSequenceFactory } from "../pluginHelpers";

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
 * import { operator } from "tyneq/plugin";
 * import { TyneqEnumerator } from "tyneq/plugin";
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
    category: OperatorCategory,
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends new (...args: any[]) => any>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        if (ReflectionUtility.tryGetPrototypeMethod(target.prototype, "handleNext") === undefined) {
            throw new PluginError(
                `@operator("${name}"): class "${target.name}" must define a protected handleNext(): IteratorResult<T> method. `
                + "Ensure the class extends TyneqEnumerator<TInput, TOutput>.",
                "operator",
                target.name
            );
        }

        OperatorRegistry.register({
            metadata: new OperatorMetadata(name, category, "external", TyneqEnumerableBase),
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                const base = this;
                const factory = asSequenceFactory(this);
                const node = new QueryNode(name, userArgs, factory[tyneqQueryNode], category);
                return factory.createEnumerable({
                    getEnumerator() {
                        return new target(base.getEnumerator(), ...userArgs);
                    }
                }, node);
            }
        });
        return target;
    };
}
