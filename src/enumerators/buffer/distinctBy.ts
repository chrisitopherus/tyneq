import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that filters out elements with duplicate keys from a sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Tracks seen keys in a `Set`. Yields the first element for each key, in first-seen-key order.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "distinctBy", kind: "buffer" })
export class DistinctByEnumerator<TSource, TKey> extends TyneqEnumerator<TSource> {
    private readonly seenValues = new Set<TKey>();
    private readonly keySelector: (item: TSource) => TKey;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param keySelector - Extracts the comparison key from each element.
     */
    public constructor(sourceEnumerator: Enumerator<TSource>, keySelector: (item: TSource) => TKey) {
        super(sourceEnumerator);
        this.keySelector = keySelector;
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            const key = this.keySelector(value);

            if (!this.seenValues.has(key)) {
                this.seenValues.add(key);
                return this.yield(value);
            }
        }
    }
}