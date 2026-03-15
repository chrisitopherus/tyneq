import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { operator } from "../../extensibility/operatorDecorators";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that yields elements whose keys appear in both the source and another key sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Buffers the other keys into a `Set` on first iteration. Each unique key appears at most once
 * in the output.
 *
 * @group Enumerators
 * @internal
 */
@operator<[otherValues: unknown, keySelector: unknown]>("intersectBy", "buffer", (otherValues, keySelector) => {
    ArgumentUtility.checkNotOptional({ otherValues });
    ArgumentUtility.checkNotOptional({ keySelector });
})
export class IntersectByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly otherValues: Iterable<TKey>;
    private readonly keySelector: (item: TSource) => TKey;
    private intersectionKeys = new Set<TKey>();
    private bufferedKeys = new Set<TKey>();

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param otherValues - The keys to intersect with; buffered into a `Set` on first iteration.
     * @param keySelector - Extracts the comparison key from each source element.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, otherValues: Iterable<TKey>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
        this.keySelector = keySelector;
    }

    protected override initialize(): void {
        this.intersectionKeys = new Set<TKey>(this.otherValues);
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            const key = this.keySelector(value);

            if (this.intersectionKeys.has(key) && !this.bufferedKeys.has(key)) {
                this.bufferedKeys.add(key);
                return this.yield(value);
            }
        }
    }
}
