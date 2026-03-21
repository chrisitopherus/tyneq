import { tyneqQueryNode } from "../types/queryplan";
import type { IQueryNode } from "../types/queryplan";

/**
 * Minimal structural interface used internally by operator registration to call
 * `createEnumerable` without triggering TypeScript's `protected` access modifier check.
 *
 * @remarks
 * `createEnumerable` is `protected` on `TyneqEnumerableBase`. The registration `impl`
 * functions run with `this` typed as `TyneqEnumerableBase<unknown>`, which cannot call
 * protected methods from outside the class hierarchy. This interface describes the shape
 * at the call site, sidestepping the access modifier via a double-cast
 * (`as unknown as IWithCreateEnumerable`). Safe at runtime because `this` is always a
 * `TyneqEnumerable` subclass instance.
 *
 * @internal
 */
export interface IWithCreateEnumerable {
    createEnumerable(factory: { getEnumerator(): unknown }, node?: IQueryNode | null): unknown;
    readonly [tyneqQueryNode]: IQueryNode | null;
}
