import { builtinOperator } from "../../plugin/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Returns elements from the source sequence whose keys are not present in a second key sequence.
 *
 * @remarks
 * Deferred. Source is fully buffered on the first iteration of the returned sequence.
 *
 * @see {@link TyneqSequence.exceptBy}
 * @group Operators
 * @category Buffering
 * @internal
 */
@builtinOperator({ name: "exceptBy", kind: "buffer" })
export class ExceptByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly excludedKeys: Iterable<TKey>;
    private excludeSet = new Set<TKey>();
    private readonly keySelector: (item: TSource) => TKey;

    
    public constructor(sourceEnumerator: Enumerator<TSource>, excludedKeys: Iterable<TKey>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.excludedKeys = excludedKeys;
        this.keySelector = keySelector;
    }

    protected override initialize(): void {
        this.excludeSet = new Set<TKey>(this.excludedKeys);
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            const key = this.keySelector(value);
            if (!this.excludeSet.has(key)) {
                this.excludeSet.add(key);
                return this.yield(value);
            }
        }
    }
}