import { tyneqQueryNode } from "../types/queryplan";
import type { IQueryNode } from "../types/queryplan";

/**
 * Minimal structural interface used internally by operator registration to call
 * `createEnumerable` without triggering TypeScript's `protected` access modifier check.
 *
 * @see ATTENTION.md §3 — "createEnumerable Protected Access — Structural Cast Pattern"
 * @internal
 */
export interface IWithCreateEnumerable {
    createEnumerable(factory: { getEnumerator(): unknown }, node?: IQueryNode | null): unknown;
    readonly [tyneqQueryNode]: IQueryNode | null;
}
