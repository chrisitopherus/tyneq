import { setOperatorMetadata, tyneqOperatorMetadata } from "../core/registry/OperatorMetadata";
import { OperatorRegistry } from "../core/registry/TyneqOperatorRegistry";
import { IOperatorMetadataCarrier } from "../types/core";
import { Constructor } from "../types/utility";

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
    return function <TClass extends Constructor>(
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
