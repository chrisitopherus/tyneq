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
 * Method decorator - declares this method as a built-in operator.
 *
 * Stores `BuiltinOptions` on the function object so `@sequence` can find it.
 * Does NOT register anything by itself - registration happens in `@sequence`.
 *
 * @remarks
 * This is one half of a two-decorator pattern. Apply `@builtin` to each method on a class
 * decorated with `@sequence`. When the module is evaluated, `@sequence` will scan all
 * `@builtin`-tagged methods and call `OperatorRegistry.registerBuiltin` for each.
 *
 * Only use on methods of `TyneqEnumerableCore` or `TyneqEnumerableBase`. Third-party
 * operators should use `@operator`, `@terminal`, or the `createOperator` factory instead.
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