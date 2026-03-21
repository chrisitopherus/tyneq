import { TyneqCachedEnumerable } from "../../core/cache/TyneqCachedEnumerable";
import { TyneqEnumeratorCore } from "../../core/enumerators/TyneqEnumeratorCore";

/**
 * Enumerator that reads from a shared {@link TyneqCachedEnumerable}.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Yields elements from the cache by index. The cache lazily expands the underlying source on
 * demand. Multiple `MemoizeEnumerator` instances over the same cache share the underlying
 * source while each maintaining its own position independently.
 *
 * @group Enumerators
 * @internal
 */
export class MemoizeEnumerator<TSource> extends TyneqEnumeratorCore<TSource> {
    private readonly cachedEnumerable: TyneqCachedEnumerable<TSource>;
    private index = 0;

    /**
     * @param cachedEnumerable - The shared cache to read elements from.
     */
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
