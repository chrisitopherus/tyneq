import { OperatorRegistry } from "./OperatorRegistry";
import { tyneqOperatorMetadata } from "../queryplan/operatorMetadata";

/**
 * Options for {@link builtinTerminal}.
 *
 * @internal
 */
export interface BuiltinTerminalOptions {
    readonly name: string;
}

/**
 * Class decorator for Tyneq's own built-in terminal operators.
 *
 * Records the operator in `OperatorRegistry` (for introspection) without patching
 * the prototype -- built-in terminal operators are already defined as direct methods on
 * `TyneqEnumerableBase`.
 *
 * @internal
 */
export function builtinTerminal(options: BuiltinTerminalOptions) {
    return function <TClass extends new (...args: any[]) => any>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        const { name } = options;
        (target as unknown as Record<PropertyKey, unknown>)[tyneqOperatorMetadata] = {
            name,
            category: "terminal",
        };
        OperatorRegistry.registerBuiltin(name, "terminal");
        return target;
    };
}
