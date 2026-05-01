import { Nullable } from "../../types/utility";
import { TyneqBaseEnumerator } from "../enumerators/TyneqBaseEnumerator";

/**
 * Yields all elements from each source iterable in order.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
export class SourceConcatEnumerator<TSource> extends TyneqBaseEnumerator<TSource> {
    private readonly sources: Iterable<TSource>[];
    private currentSourceIndex: number = 0;
    private currentIterator: Nullable<Iterator<TSource>> = null;

    public constructor(...sources: Iterable<TSource>[]) {
        super();
        this.sources = sources;
    }

    protected override disposeAdditional(): void {
        try {
            this.currentIterator?.return?.();
        } catch {
            // swallow
        }

        this.currentIterator = null;
    }

    protected override handleNext(): IteratorResult<TSource> {
        while (this.currentSourceIndex < this.sources.length) {
            if (this.currentIterator === null) {
                this.currentIterator = this.sources[this.currentSourceIndex][Symbol.iterator]();
            }

            const result = this.currentIterator.next();
            if (!result.done) {
                return this.yield(result.value);
            }

            this.currentIterator = null;
            this.currentSourceIndex++;
        }

        return this.done();
    }
}
