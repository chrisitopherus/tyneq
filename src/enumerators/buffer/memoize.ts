import { TyneqCachedEnumerable } from "../../core/cache/TyneqCachedEnumerable";
import { TyneqBaseEnumerator } from "../../core/enumerators/TyneqBaseEnumerator";

/**
 * Enumerator implementation that reads from a shared {@link TyneqCachedEnumerable}.
 *
 * @remarks
 * Yields elements from the cache by index. The cache lazily expands the underlying
 * source on demand; this enumerator advances the index after each successful yield.
 * Multiple `MemoizeEnumerator` instances over the same cache share the underlying
 * source, with each instance maintaining its own position independently.
 *
 * **Performance**: O(1) space per enumerator (shared cache holds the elements).
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @group Enumerators
 * @internal
 */
export class MemoizeEnumerator<TSource> extends TyneqBaseEnumerator<TSource> {
    private readonly cachedEnumerable: TyneqCachedEnumerable<TSource>;
    private index = 0;

    public constructor(cachedEnumerable: TyneqCachedEnumerable<TSource>) {
        super();
        this.cachedEnumerable = cachedEnumerable;
    }

    protected override dispose(value?: unknown): void {
        // noop - no resources to dispose
    }

    protected override disposeSource(): void {
        // noop - no source enumerator to dispose
    }

    protected override handleNext(): IteratorResult<TSource> {
        const result = this.cachedEnumerable.tryGetAtFromCache(this.index);

        if (!result.has) {
            return this.done();
        }

        this.index++;
        return this.yield(result.value);
    }
}