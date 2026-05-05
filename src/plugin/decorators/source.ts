import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import type { OperatorSource } from "../../types/core";

/**
 * Options for the {@link source} decorator.
 */
export interface SourceDecoratorOptions {
    /**
     * The operator name used to look up this source in the registry.
     * Must match the `operatorName` on the `QueryPlanNode`.
     * Defaults to the decorated method's name when omitted.
     */
    readonly name?: string;
    /**
     * Whether this is a built-in (`"internal"`) or third-party (`"external"`) source.
     * Defaults to `"external"`.
     */
    readonly source?: OperatorSource;
}

/**
 * Static method decorator that registers the decorated method as a source operator.
 *
 * The method itself becomes the factory: when the compiler resolves a source node
 * whose `operatorName` matches the registered name, it calls the method with the
 * node's `args`. No duplication of implementation - the registration points directly
 * at the method.
 *
 * The operator name defaults to the method name, so `@source()` is sufficient when
 * they match.
 *
 * @param options - Optional config. Omit entirely to use all defaults.
 *
 * @example
 * ```ts
 * import { source } from "tyneq/plugin";
 * import { Tyneq } from "tyneq";
 *
 * class MySources {
 *     @source()
 *     public static fibonacci(count: number): ReturnType<typeof Tyneq.range> {
 *         // registered as "fibonacci"
 *     }
 *
 *     @source({ name: "fib2", source: "external" })
 *     public static fibonacci2(count: number): ReturnType<typeof Tyneq.range> {
 *         // registered as "fib2"
 *     }
 * }
 * ```
 *
 * @group Decorators
 */
export function source(options: SourceDecoratorOptions = {}) {
    return function <TMethod extends (...args: any[]) => any>(
        method: TMethod,
        context: ClassMethodDecoratorContext & { static: true }
    ): void {
        const operatorName = options.name ?? (context.name as string);
        const operatorSource = options.source ?? "external";
        OperatorRegistry.registerSource(operatorName, method as (...args: unknown[]) => unknown, operatorSource);
    };
}
