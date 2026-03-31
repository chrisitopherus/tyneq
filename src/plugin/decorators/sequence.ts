import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { SequenceConstructor } from "../../types/core";
import { ReflectionUtility } from "../../utility/ReflectionUtility";
import { builtinMeta, BuiltinMetadata, BuiltinOptions, MethodWithMetadata } from "./builtin";

/**
 * Class decorator — declares this class as a sequence whose `@builtin` methods are operators.
 *
 * Scans the prototype for `@builtin`-tagged methods and registers each one via
 * `OperatorRegistry.registerBuiltin`, passing this class as `targetClass`.
 *
 * @internal
 */
export function sequence(
    target: SequenceConstructor,
    _context: ClassDecoratorContext
): void {
    for (const key of Object.getOwnPropertyNames(target.prototype)) {
        const method = ReflectionUtility.tryGetPrototypeMethod(target.prototype, key);
        if (method && builtinMeta in method) {
            const metadata: BuiltinMetadata = (method as MethodWithMetadata)[builtinMeta];
            OperatorRegistry.registerBuiltin(metadata.name, metadata.kind, target);
        }
    }
}