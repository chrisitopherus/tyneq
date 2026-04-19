import type { EnumeratorFactory, SequenceFactory } from "../types/core";
import type { OperatorCategory, QueryPlanNode } from "../types/queryplan";
import type { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";
import { QueryNode } from "../queryplan/QueryNode";
import { tyneqQueryNode } from "../types/queryplan";

/**
 * Low-level helpers used by every decorator and registration function in `src/plugin`.
 *
 * @remarks
 * These methods centralise two patterns that would otherwise be copy-pasted into every
 * operator `impl` closure:
 *
 * - {@link buildEnumerable} -- validate, create a query node, then call
 *   `createEnumerable`. Used by every standard operator decorator and factory.
 * - {@link buildQueryNode} -- create a query node only. Used by `createOrderedOperator`
 *   and `createCachedOperator`, which construct the result sequence themselves.
 *
 * `asSequenceFactory` is kept private to this class; it exists only to resolve the
 * `protected` access modifier on `createEnumerable` via a structural double-cast.
 *
 * @internal
 */
export class RegistrationUtility {
    private constructor() { }

    /**
     * Builds a new sequence from an enumerator factory and registers a query plan node.
     *
     * @remarks
     * Every standard (non-terminal, non-ordered, non-cached) operator `impl` follows
     * the same pattern: get the `SequenceFactory` view of `this`, create a `QueryNode`,
     * then call `factory.createEnumerable(enumeratorFactory, node)`. This method
     * centralises that pattern so decorator and factory `impl` bodies stay minimal.
     *
     * @param sequence - The current sequence (`this` inside an `impl` function).
     * @param name - Operator name, used as the query node label.
     * @param userArgs - Arguments passed by the caller, captured in the query node.
     * @param category - Operator category for the query node.
     * @param enumeratorFactory - The factory that produces the new enumerator.
     */
    public static buildEnumerable(
        sequence: TyneqEnumerableBase<unknown>,
        name: string,
        userArgs: unknown[],
        category: OperatorCategory,
        enumeratorFactory: EnumeratorFactory<unknown>
    ): unknown {
        const factory = RegistrationUtility.asSequenceFactory(sequence);
        const node = new QueryNode(name, userArgs, factory[tyneqQueryNode], category);
        return factory.createEnumerable(enumeratorFactory, node);
    }

    /**
     * Creates a `QueryPlanNode` for an operator, linked to the upstream node on `sequence`.
     *
     * @remarks
     * Used by `createOrderedOperator` and `createCachedOperator`, which hand the node
     * directly to their own factory function (because those factories construct the result
     * sequence themselves rather than delegating to `createEnumerable`).
     *
     * @param sequence - The current sequence (`this` inside an `impl` function).
     * @param name - Operator name, used as the query node label.
     * @param userArgs - Arguments passed by the caller, captured in the query node.
     * @param category - Operator category for the query node.
     */
    public static buildQueryNode(
        sequence: TyneqEnumerableBase<unknown>,
        name: string,
        userArgs: unknown[],
        category: OperatorCategory
    ): QueryPlanNode {
        const factory = RegistrationUtility.asSequenceFactory(sequence);
        return new QueryNode(name, userArgs, factory[tyneqQueryNode], category);
    }

    /**
     * Narrows a `TyneqEnumerableBase` to its `SequenceFactory` view.
     *
     * @remarks
     * The double-cast (`as unknown as SequenceFactory`) is required because
     * `createEnumerable` and `createCachedEnumerable` are `protected` on the
     * class hierarchy. `SequenceFactory` is a structural interface that describes
     * the same shape, allowing registration-time closures to call factory methods
     * without changing their access modifier. This is a known architectural trade-off
     * documented in `tasks/lessons.md` under "Architecture Decisions".
     */
    private static asSequenceFactory<TSource>(sequence: TyneqEnumerableBase<TSource>): SequenceFactory<TSource> {
        return sequence as unknown as SequenceFactory<TSource>;
    }
}
