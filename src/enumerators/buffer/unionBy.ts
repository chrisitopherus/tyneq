import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that yields elements from both the source and a second sequence whose keys are unique.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Enumerates the source first, then the second sequence. Each unique key appears at most once
 * in the output. The first element encountered for a given key is yielded.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "unionBy", kind: "buffer" })
export class UnionByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly otherValues: Iterable<TSource>;
    private readonly bufferedKeys = new Set<TKey>();
    private readonly keySelector: (item: TSource) => TKey;
    private currentEnumerator: Enumerator<TSource>;
    private isSourceDone = false;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param otherValues - The second sequence to union with.
     * @param keySelector - Extracts the comparison key from each element.
     */
    public constructor(sourceEnumerator: Enumerator<TSource>, otherValues: Iterable<TSource>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
        this.currentEnumerator = this.sourceEnumerator;
        this.keySelector = keySelector;
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.currentEnumerator.next();
            if (done) {
                if (this.isSourceDone) {
                    return this.done();
                }

                this.isSourceDone = true;
                this.currentEnumerator = this.otherValues[Symbol.iterator]();
                continue;
            }

            const key = this.keySelector(value);
            if (!this.bufferedKeys.has(key)) {
                this.bufferedKeys.add(key);
                return this.yield(value);
            }
        }
    }
}