import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { operator } from '../../extensibility/operatorDecorators';

/**
 * Enumerator that conditionally executes a side-effect action on each element.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * Evaluates `predicate` (which takes no arguments) for each element. When `predicate` returns `true`,
 * `action` is invoked with the element. All elements are yielded unchanged regardless of the predicate result.
 *
 * The predicate represents a global condition (e.g., a debug flag) rather than an element-specific test.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @group Enumerators
 * @internal
 */
@operator<[action: unknown, predicate: unknown]>('tapIf', (action, predicate) => {
    ArgumentUtility.checkNotOptional({ action });
    ArgumentUtility.checkNotOptional({ predicate });
})
export class TapIfEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly action: (item: TSource) => void;
    private readonly predicate: () => boolean;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param action - Invoked with each element when `predicate` returns `true`.
     * @param predicate - A zero-argument function that controls whether `action` runs.
     */
    public constructor(sourceEnumerator: IEnumerator<TSource>, action: (item: TSource) => void, predicate: () => boolean) {
        super(sourceEnumerator);
        this.action = action;
        this.predicate = predicate;
    }

    protected override handleNext(): IteratorResult<TSource> {
        const next = this.sourceEnumerator.next();
        if (next.done) {
            return this.done();
        }

        if (this.predicate()) {
            this.action(next.value);
        }

        return this.yield(next.value);
    }
}
