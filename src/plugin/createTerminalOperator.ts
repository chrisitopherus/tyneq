/**
 * Registers a terminal operator using a plain function.
 *
 * The simplest registration API for terminal operators.
 * `execute` receives the full source sequence and any user arguments and returns a concrete value.
 *
 * @param config.name - Method name to expose on every sequence.
 * @param config.execute - Function that consumes the source and returns a result.
 * @param config.validate - Optional eager validation for user-supplied arguments.
 *
 * @example
 * ```ts
 * import { createTerminalOperator } from "tyneq/plugin";
 *
 * createTerminalOperator({
 *     name: "product",
 *     execute(source: Iterable<number>): number {
 *         let result = 1;
 *         for (const item of source) result *= item;
 *         return result;
 *     }
 * });
 * ```
 *
 * @group Utilities
 */
import type { Enumerable } from "../types/core";
import { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";
import { OperatorRegistry, OperatorMetadata } from "./OperatorRegistry";

export function createTerminalOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    execute: (source: Enumerable<TSource>, ...args: TArgs) => TResult;
    validate?: (...args: NoInfer<TArgs>) => void;
    
    source?: "internal" | "external";
}): void {
    OperatorRegistry.register({
        metadata: new OperatorMetadata(config.name, "terminal", config.source ?? "external"),
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            return config.execute(this as Enumerable<TSource>, ...(args as TArgs));
        }
    });
}
