import { tyneqQueryNode } from "../types/queryplan";
import type { IQueryNode } from "../types/queryplan";

/**
 * Structural interface used by registration machinery to call the protected
 * `createEnumerable` method on `TyneqEnumerableBase` without exposing it publicly.
 *
 * The double-cast `(this as unknown as IWithCreateEnumerable)` is intentional:
 * `createEnumerable` is `protected`, so the cast is the only way to call it from
 * outside the class hierarchy without changing the access modifier.
 *
 * @internal
 */
export interface IWithCreateEnumerable {
    createEnumerable(factory: { getEnumerator(): unknown }, node?: IQueryNode | null): unknown;
    readonly [tyneqQueryNode]: IQueryNode | null;
}
