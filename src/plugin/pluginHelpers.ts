import type { SequenceFactory } from "../types/core";
import type { TyneqEnumerableBase } from "../core/TyneqEnumerableBase";

/**
 * Narrows a `TyneqEnumerableBase` to its `SequenceFactory` view.
 *
 * @remarks
 * The double-cast (`as unknown as SequenceFactory`) is required because
 * `createEnumerable` and `createCachedEnumerable` are `protected` on the
 * class hierarchy. `SequenceFactory` is a structural interface that describes
 * the same shape, allowing registration-time closures to call factory methods
 * without changing their access modifier.
 *
 * This helper centralises the cast so it appears in exactly one place instead
 * of being duplicated across every decorator and registration function.
 *
 * @internal
 */
export function asSequenceFactory<TSource>(sequence: TyneqEnumerableBase<TSource>): SequenceFactory<TSource> {
    return sequence as unknown as SequenceFactory<TSource>;
}
