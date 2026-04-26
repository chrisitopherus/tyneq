import { OperatorRegistry } from "../../core/registry/TyneqOperatorRegistry";
import { SequenceConstructor } from "../../types/core";
import { reflect } from "../../utility/reflect";
import { builtinMeta, BuiltinMetadata, BuiltinOptions, MethodWithMetadata } from "./builtin";

/**
 * Class decorator - declares this class as a sequence whose `@builtin` methods are operators.
 *
 * Scans the prototype for `@builtin`-tagged methods and registers each one via
 * `OperatorRegistry.registerBuiltin`, passing this class as `targetClass`.
 *
 * @remarks
 * Works in tandem with `@builtin`. The two-decorator pattern:
 * 1. Decorate each built-in method with `@builtin({ kind: "streaming" | "buffer" })`.
 *    `@builtin` stamps a `builtinMeta` symbol onto the function object - it does NOT register.
 * 2. Decorate the containing class with `@sequence`.
 *    `@sequence` scans the prototype, finds all `@builtin`-tagged methods, and calls
 *    `OperatorRegistry.registerBuiltin` for each one.
 *
 * Apply only to `TyneqEnumerableCore` and `TyneqEnumerableBase` - the two base classes
 * whose methods form the built-in operator surface. Never use on third-party or test classes.
 *
 * @internal
 */
export function sequence(
    target: SequenceConstructor,
    _context: ClassDecoratorContext
): void {
    for (const key of Object.getOwnPropertyNames(target.prototype)) {
        const method = reflect(target.prototype).tryGetMethod(key)?.value;
        if (method && builtinMeta in method) {
            const metadata: BuiltinMetadata = (method as MethodWithMetadata)[builtinMeta];
            OperatorRegistry.registerBuiltin(metadata.name, metadata.kind, target);
        }
    }
}