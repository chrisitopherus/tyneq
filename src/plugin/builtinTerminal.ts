import { setOperatorMetadata } from "../core/registry/OperatorMetadata";
import { OperatorRegistry } from "../core/registry/TyneqOperatorRegistry";

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
    return function <TClass extends Function>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        const { name } = options;
        setOperatorMetadata(target, {
            name,
            category: "terminal",
        });
        
        OperatorRegistry.registerBuiltin(name, "terminal");
        return target;
    };
}
