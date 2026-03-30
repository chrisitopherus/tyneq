import { OperatorMetadata, setOperatorMetadata, tyneqOperatorMetadata } from "../core/registry/OperatorMetadata";
import { OperatorRegistry } from "../core/registry/TyneqOperatorRegistry";

/**
 * Options for {@link builtinOperator}.
 *
 * @internal
 */
export interface BuiltinOperatorOptions {
    readonly name: string;
    readonly kind: Exclude<OperatorMetadata["kind"], "terminal">;
}

/**
 * Class decorator for Tyneq's own built-in streaming and buffering operators.
 *
 * Records the operator in `OperatorRegistry` (for introspection) without patching
 * the prototype -- built-in operators are already defined as direct methods on
 * `TyneqEnumerableBase`.
 *
 * @internal
 */
export function builtinOperator(
    options: BuiltinOperatorOptions
) {
    return function <TClass extends Function>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        const { name, kind } = options;
        setOperatorMetadata(target, {
            name,
            category: kind,
        });

        OperatorRegistry.registerBuiltin(name, kind);
        return target;
    };
}
