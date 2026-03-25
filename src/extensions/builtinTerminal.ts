import { OperatorRegistry } from "./OperatorRegistry";
import { tyneqOperatorMetadata } from "../queryplan/operatorMetadata";

export interface BuiltinTerminalOptions {
    readonly name: string;
}

/**
 * Internal class decorator that registers built-in terminal operator metadata on import.
 *
 * @remarks
 * Unlike `@terminal`, this decorator does not patch prototypes and does not execute
 * validation logic. It only registers metadata for introspection.
 *
 * Intended for Tyneq internal operator classes only.
 *
 * @param options - Built-in terminal operator metadata.
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
