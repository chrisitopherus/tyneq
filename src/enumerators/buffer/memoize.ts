import { TyneqCachedEnumerable } from "../../core/cache/TyneqCachedEnumerable";
import { TyneqBaseEnumerator } from "../../core/enumerators/TyneqBaseEnumerator";

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

    protected override handleNext(): IteratorResult<TSource, any> {
        const result = this.cachedEnumerable.tryGetAtFromCache(this.index);

        if (!result.has) {
            return this.done();
        }

        this.index++;
        return this.yield(result.value);
    }
}