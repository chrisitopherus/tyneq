import { OperatorMetadata } from "../../core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { TyneqCachedEnumerable } from "../../core/TyneqCachedEnumerable";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { Constructor } from "../../types/utility";
import { PluginError } from "../../core/errors/PluginError";
import { reflect } from "../../utility/reflect";
import { RegistrationUtility } from "../RegistrationUtility";

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
 *     private readonly iter: Enumerator<T>;
 *     public constructor(source: CachedEnumerable<T>) {
 *         super(source);
 *         this.iter = this.cachedSource.getEnumerator();
 *     }
 *     protected handleNext(): IteratorResult<T> {
 *         // this.cachedSource gives access to the full CachedEnumerable
 *         return this.iter.next();
 *     }
 * }
 * ```
 *
 * @group Decorators
 */
export function cachedOperator<TArgs extends unknown[] = never>(
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
                `@cachedOperator("${name}"): class "${target.name}" must define a protected handleNext(): IteratorResult<T> method. `
                + "Ensure the class extends TyneqCachedEnumerator<T>.",
                "cachedOperator",
                target.name
            );
        }

        OperatorRegistry.register({
            metadata: OperatorMetadata.forCategory(category, name, TyneqCachedEnumerable),
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                const base = this as unknown as TyneqCachedEnumerable<unknown>;
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
