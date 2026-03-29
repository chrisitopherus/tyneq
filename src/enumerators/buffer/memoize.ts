import { TyneqCachedEnumerable } from "../../core/TyneqCachedEnumerable";
import { TyneqBaseEnumerator } from "../../core/enumerators/TyneqBaseEnumerator";

/**
 * Iterates a cached enumerable, replaying previously computed elements on subsequent iterations.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.memoize}
 * @group Operators
 * @category Buffering
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
