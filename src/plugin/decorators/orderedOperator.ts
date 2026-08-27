import { OperatorMetadata } from "../../core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { TyneqOrderedEnumerable } from "../../core/ordering/TyneqOrderedEnumerable";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { Constructor } from "../../types/utility";
import { PluginError } from "../../core/errors/PluginError";
import { reflect } from "../../utility/reflect";
import { RegistrationUtility } from "../RegistrationUtility";

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
 * import { orderedOperator, TyneqOrderedEnumerator } from "tyneq/plugin";
 *
 * @orderedOperator("myThenBy", "buffer", (keySelector) => {
 *     if (typeof keySelector !== "function") throw new Error("keySelector must be a function");
 * })
 * class MyThenByEnumerator<T> extends TyneqOrderedEnumerator<T> {
 *     private readonly iter: Enumerator<T>;
 *     public constructor(source: OrderedEnumerable<T>, private readonly keySelector: (item: T) => unknown) {
 *         super(source);
 *         this.iter = this.orderedSource.getEnumerator();
 *     }
 *     protected handleNext(): IteratorResult<T> {
 *         // this.orderedSource gives access to the full OrderedEnumerable
 *         return this.iter.next();
 *     }
 * }
 * ```
 *
 * @group Decorators
 */
export function orderedOperator<TArgs extends unknown[] = never>(
    name: string,
    category: "streaming" | "buffer",
    validate?: (...args: TArgs) => void
) {
    // `any` is a required decorator idiom, not a shortcut - see tasks/lessons.md,
    // "Architecture Decisions": TS contravariant parameter checking rejects `unknown` here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function <TClass extends Constructor<any>>(target: TClass, _context: ClassDecoratorContext<TClass>): TClass {
        if (!reflect(target.prototype, { inherited: true }).hasMethod("handleNext")) {
            throw new PluginError(
                `@orderedOperator("${name}"): class "${target.name}" must define a protected handleNext(): IteratorResult<T> method. `
                + "Ensure the class extends TyneqOrderedEnumerator<T>.",
                "orderedOperator",
                target.name
            );
        }

        OperatorRegistry.register({
            metadata: OperatorMetadata.forCategory(category, name, TyneqOrderedEnumerable),
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                const base = this as unknown as TyneqOrderedEnumerable<unknown, unknown>;
                return RegistrationUtility.buildEnumerable(this, name, userArgs, category, {
                    // Same required `any`-decorator idiom as TClass's constraint above.
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    getEnumerator: () => new target(base, ...userArgs)
                });
            }
        });
        return target;
    };
}
