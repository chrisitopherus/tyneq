import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that yields elements present in both the source and another sequence.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Buffers the other sequence into a `Set` on first iteration. Each value appears at most once
 * in the output.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "intersect", kind: "buffer" })
export class IntersectEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly otherValues: Iterable<TSource>;
    private intersectionValues = new Set<TSource>();
    private bufferedValues = new Set<TSource>();

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param otherValues - The second sequence; buffered into a `Set` on first iteration.
     */
    public constructor(sourceEnumerator: Enumerator<TSource>, otherValues: Iterable<TSource>) {
        super(sourceEnumerator);
        this.otherValues = otherValues;
    }

    protected override initialize(): void {
        this.intersectionValues = new Set<TSource>(this.otherValues);
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (true) {
            const { done, value } = this.sourceEnumerator.next();
            if (done) {
                return this.done();
            }

            if (this.intersectionValues.has(value) && !this.bufferedValues.has(value)) {
                this.bufferedValues.add(value);
                return this.yield(value);
            }
        }
    }
}