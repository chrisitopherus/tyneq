import { OperatorMetadata } from "../../core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../core/TyneqEnumerableBase";
import { TyneqCachedEnumerable } from "../../core/TyneqCachedEnumerable";
import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import type { CachedEnumerable, OperatorSource } from "../../types/core";

/**
 * Registers a terminal operator available only on cached sequences.
 *
 * The `execute` function receives the full `CachedEnumerable` as its first argument,
 * giving access to cached-sequence members (`refresh()`, internal cache, etc.).
 *
 * @param config.name - Method name to expose on cached sequences.
 * @param config.execute - Function that consumes the cached source and returns a result.
 * @param config.validate - Optional eager validation for user-supplied arguments.
 *
 * @example
 * ```ts
 * createCachedTerminalOperator({
 *     name: "cacheSize",
 *     execute(source: CachedEnumerable<unknown>): number {
 *         return [...source].length;
 *     }
 * });
 * ```
 *
 * @group Decorators
 */
export function createCachedTerminalOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    execute: (source: CachedEnumerable<TSource>, ...args: TArgs) => TResult;
    validate?: (...args: NoInfer<TArgs>) => void;
    source?: OperatorSource;
}): void {
    OperatorRegistry.register({
        metadata: new OperatorMetadata(config.name, "terminal", config.source ?? "external", TyneqCachedEnumerable),
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            return config.execute(this as unknown as CachedEnumerable<TSource>, ...(args as TArgs));
        }
    });
}
