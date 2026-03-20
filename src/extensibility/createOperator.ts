import type { IEnumerable, IEnumeratorFactory } from "../types/core";
import { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";
import { OperatorRegistry, OperatorMetadata } from "./OperatorRegistry";
import { QueryNode } from "../queryplan/QueryNode";
import { tyneqQueryNode } from "../types/queryplan";
import type { IWithCreateEnumerable } from "./registrationShared";

/**
 * Defines and immediately registers a streaming or buffering operator on all
 * `TyneqEnumerable` instances without requiring a class.
 *
 * @remarks
 * Call this function at module level. Registration happens as a side-effect of
 * importing the file that contains the call.
 *
 * The `factory` receives the source enumerable and any user-provided arguments,
 * and must return an `IEnumeratorFactory<TResult>`.
 *
 * Declare user-facing argument types on the `factory` function. TypeScript infers
 * `TArgs` automatically, giving `validate` a fully-typed parameter list with no
 * extra annotations.
 *
 * @typeParam TArgs - Tuple of user-facing argument types (excluding the implicit source).
 *   Inferred from the `factory` signature — no explicit type parameter needed at the call site.
 *
 * @throws {Error} If a method named `config.name` is already registered.
 *
 * @group Utilities
 *
 * @example
 * ```ts
 * // everyNth.ts — importing this file registers the operator
 * import { createOperator } from '../extensibility/createOperator';
 *
 * createOperator({
 *     name: 'everyNth',
 *     factory(source: IEnumerable<unknown>, n: number) {
 *         return {
 *             getEnumerator() {
 *                 return everyNthGenerator(source[Symbol.iterator](), n) as unknown as IEnumerator<unknown>;
 *             }
 *         };
 *     },
 *     validate(n) {  // n: number — inferred, no annotation needed
 *         ArgumentUtility.checkPositive({ n });
 *     }
 * });
 * ```
 */
export function createOperator<TSource, TArgs extends unknown[], TResult>(config: {
    name: string;
    kind?: "streaming" | "buffer";
    factory: (source: IEnumerable<TSource>, ...args: TArgs) => IEnumeratorFactory<TResult>;
    validate?: (...args: NoInfer<TArgs>) => void;
    /** @internal */
    source?: "internal" | "external";
}): void {
    const kind = config.kind ?? "streaming";
    OperatorRegistry.register({
        metadata: new OperatorMetadata(config.name, kind, config.source ?? "external"),
        impl: function (this: TyneqEnumerableBase<unknown>, ...args: unknown[]) {
            config.validate?.(...(args as TArgs));
            const withCreate = this as unknown as IWithCreateEnumerable;
            const node = new QueryNode(config.name, args, withCreate[tyneqQueryNode], kind);
            return withCreate.createEnumerable(
                config.factory(this as IEnumerable<TSource>, ...(args as TArgs)),
                node
            );
        }
    });
}
