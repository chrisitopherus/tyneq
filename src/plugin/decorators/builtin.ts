import { OperatorKind } from "../../types/core";
import { Method } from "../../types/utility";

export const builtinMeta = Symbol("tyneq.builtinMetadata");

export type BuiltinMetadata = {
    name: string;
    kind: OperatorKind;
}

export type MethodWithMetadata = Method & { [builtinMeta]: BuiltinMetadata };

export interface BuiltinOptions {
    readonly kind: OperatorKind;
}

/**
 * Method decorator — declares this method as a built-in operator.
 *
 * Stores `BuiltinOptions` on the function object so `@sequence` can find it.
 * Does NOT register anything by itself — registration happens in `@sequence`.
 *
 * @internal
 */
export function builtin(options: BuiltinOptions) {
    return function <T extends Method>(value: T, context: ClassMethodDecoratorContext): T {
        (value as unknown as MethodWithMetadata)[builtinMeta] = {
            name: context.name as string,
            kind: options.kind,
        };

        return value;
    };
}