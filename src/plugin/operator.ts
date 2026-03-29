/**
 * Class decorator that registers a `TyneqEnumerator` subclass as a streaming or buffering operator.
 *
 * Validation runs eagerly at the call site, before the lazy enumerator is created.
 * Kind is inferred from the class hierarchy (`TyneqEnumerator` -> streaming) unless passed explicitly.
 *
 * @param name - Method name to expose on every sequence.
 * @param kindOrValidate - Kind override (`"streaming"` | `"buffer"`) or eager validation function.
 * @param validate - Eager validation function when kind is passed as the second argument.
 *
 * @example
 * ```ts
 * import { operator } from "tyneq/plugin";
 * import { TyneqEnumerator } from "tyneq/plugin";
 * import type { Enumerator } from "tyneq";
 *
 * @operator<[predicate: (item: unknown) => boolean]>("myFilter", (predicate) => {
 *     if (typeof predicate !== "function") throw new Error("predicate must be a function");
 * })
 * class MyFilterEnumerator<T> extends TyneqEnumerator<T> {
 *     constructor(source: Enumerator<T>, private readonly predicate: (item: T) => boolean) {
 *         super(source);
 *     }
 *     protected handleNext(): IteratorResult<T> {
 *         while (true) {
 *             const next = this.sourceEnumerator.next();
 *             if (next.done || this.predicate(next.value)) return next;
 *         }
 *     }
 * }
 * ```
 *
 * @group Decorators
 */
import { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";
import { OperatorRegistry, OperatorMetadata } from "./OperatorRegistry";
import { inferOperatorKind } from "./inferKind";
import { QueryNode } from "../queryplan/QueryNode";
import { tyneqQueryNode } from "../types/queryplan";
import type { IWithCreateEnumerable } from "./registrationShared";

export function operator<TArgs extends unknown[] = never>(
    name: string,
    kindOrValidate?: "streaming" | "buffer" | ((...args: TArgs) => void),
    validate?: (...args: TArgs) => void
) {
    return function <TClass extends new (...args: any[]) => any>(
        target: TClass,
        _context: ClassDecoratorContext
    ): TClass {
        const kind: "streaming" | "buffer" = typeof kindOrValidate === "string"
            ? kindOrValidate
            : inferOperatorKind(target);
        const actualValidate: ((...args: TArgs) => void) | undefined =
            typeof kindOrValidate === "function" ? kindOrValidate : validate;
        OperatorRegistry.register({
            metadata: new OperatorMetadata(name, kind, "internal"),
            impl: function (this: TyneqEnumerableBase<unknown>, ...userArgs: unknown[]) {
                actualValidate?.(...(userArgs as TArgs));
                const base = this;
                const withCreate = this as unknown as IWithCreateEnumerable;
                const node = new QueryNode(name, userArgs, withCreate[tyneqQueryNode], kind);
                return withCreate.createEnumerable({
                    getEnumerator() {
                        return new target(base.getEnumerator(), ...userArgs);
                    }
                }, node);
            }
        });
        return target;
    };
}
