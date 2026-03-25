import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";

/**
 * Enumerator that yields all source elements, or a single default value if the source is empty.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * @see {@link TyneqSequence.defaultIfEmpty} for the public API.
 *
 * @group Enumerators
 * @category Streaming
 * @internal
 */
@builtinOperator({ name: "defaultIfEmpty", kind: "streaming" })
export class DefaultIfEmptyEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly defaultValue: TSource;
    private sourceDone = false;
    private hasYieldedAny = false;
    private defaultYielded = false;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param defaultValue - The value to yield when the source is empty.
     */
    public constructor(sourceEnumerator: Enumerator<TSource>, defaultValue: TSource) {
        super(sourceEnumerator);
        this.defaultValue = defaultValue;
    }

    protected override handleNext(): IteratorResult<TSource> {
        if (!this.sourceDone) {
            const next = this.sourceEnumerator.next();
            if (!next.done) {
                this.hasYieldedAny = true;
                return this.yield(next.value);
            }
            this.sourceDone = true;
        }

        if (!this.hasYieldedAny && !this.defaultYielded) {
            this.defaultYielded = true;
            return this.doneWithYield(this.defaultValue);
        }

        return this.done();
    }
}