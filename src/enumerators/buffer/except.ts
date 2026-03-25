import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that yields elements from the source that are not present in an excluded-values sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Buffers the excluded sequence into a `Set` on first iteration. Each source value appears at
 * most once in the output (already-yielded values are also added to the exclusion set).
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "except", kind: "buffer" })
export class ExceptEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly excludedValues: Iterable<TSource>;
    private excludeSet = new Set<TSource>();

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param excludedValues - Values to exclude from the result; buffered into a `Set` on first iteration.
     */
    public constructor(sourceEnumerator: Enumerator<TSource>, excludedValues: Iterable<TSource>) {
        super(sourceEnumerator);
        this.excludedValues = excludedValues;
    }

    protected override initialize(): void {
        this.excludeSet = new Set<TSource>(this.excludedValues);
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (!this.excludeSet.has(value)) {
                this.excludeSet.add(value);
                return this.yield(value);
            }
        }
    }
}