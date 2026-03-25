import { builtinOperator } from "../../extensions/builtinOperator";
import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";

/**
 * Enumerator that conditionally executes a side-effect action on each element.
 *
 * @remarks
 * Deferred. Source is not enumerated until iteration begins.
 *
 * Evaluates `predicate` (which takes no arguments) for each element. When `predicate` returns `true`,
 * `action` is invoked with the element. All elements are yielded unchanged regardless of the predicate result.
 *
 * The predicate represents a global condition (e.g., a debug flag) rather than an element-specific test.
 *
 * @group Enumerators
 * @internal
 */
@builtinOperator({ name: "tapIf", kind: "streaming" })
export class TapIfEnumerator<TSource> extends TyneqEnumerator<TSource> {
    private readonly action: (item: TSource) => void;
    private readonly predicate: () => boolean;

    /**
     * @param sourceEnumerator - The upstream enumerator to wrap.
     * @param action - Invoked with each element when `predicate` returns `true`.
     * @param predicate - A zero-argument function that controls whether `action` runs.
     */
    public constructor(sourceEnumerator: Enumerator<TSource>, action: (item: TSource) => void, predicate: () => boolean) {
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