import { OperatorMetadata } from "../../core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { TyneqCachedEnumerable } from "../../core/TyneqCachedEnumerable";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { CachedEnumerable } from "../../types/core";
import { Constructor } from "../../types/utility";

/**
 * Class decorator that registers a `TyneqCachedTerminalOperator` subclass as a terminal
 * operator available only on cached sequences.
 *
 * The class constructor receives the full `CachedEnumerable` as its first argument,
 * giving access to cached-sequence members (`refresh()`, internal cache, etc.).
 *
 * @param name - Method name to expose on cached sequences.
 * @param validate - Optional eager validation function for user-supplied arguments.
 *
 * @example
 * ```ts
 * @cachedTerminal("cacheSize")
 * class CacheSizeOperator<T> extends TyneqCachedTerminalOperator<T, number> {
 *     process(): number {
 *         return [...this.source].length;
 *     }
 * }
 * ```
 *
 * @group Decorators
 */
export function cachedTerminal<TArgs extends unknown[] = never>(
    name: string,
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends Constructor<{ process(): unknown }>>(
        target: TClass,
        _context: ClassDecoratorContext<TClass>
    ): TClass {
        OperatorRegistry.register({
            metadata: new OperatorMetadata(name, "terminal", "external", TyneqCachedEnumerable),
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                validate?.(...(userArgs as TArgs));
                const source = this as unknown as CachedEnumerable<unknown>;
                return new target(source, ...userArgs).process();
            }
        });
        return target;
    };
}
