import { OperatorMetadata, OperatorRegistry } from "./OperatorRegistry";
import { tyneqOperatorMetadata } from "../queryplan/operatorMetadata";

export interface BuiltinOperatorOptions {
    readonly name: string;
    readonly kind: Exclude<OperatorMetadata["kind"], "terminal">;
}

/**
 * Internal class decorator that registers built-in operator metadata on import.
 *
 * @remarks
 * Unlike `@operator`, this decorator does not patch prototypes and does not execute
 * validation logic. It only calls `OperatorRegistry.registerBuiltin(...)` so
 * registry introspection includes internal operators.
 *
 * Intended for Tyneq internal operator classes only.
 *
 * @param options - Built-in operator metadata.
 * @internal
 */
export function builtinOperator(
    options: BuiltinOperatorOptions
) {
    return function <TClass extends new (...args: any[]) => any>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        const { name, kind } = options;
        (target as unknown as Record<PropertyKey, unknown>)[tyneqOperatorMetadata] = {
            name,
            category: kind,
        };
        OperatorRegistry.registerBuiltin(name, kind);
        return target;
    };
}
