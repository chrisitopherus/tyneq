import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { operator } from "../../extensibility/operatorDecorators";
import { IEnumerable, IEnumerator } from "../../types/core";

/**
 * Streaming operator implementation for providing a default value if a sequence is empty.
 *
 * @remarks
 * This is a streaming operator that lazily checks whether the source sequence is empty
 * during enumeration. If the first call to `next()` returns `done: true`, a single element
 * containing the default value is yielded. Otherwise all source elements are passed through
 * unchanged, including the first element that was used for the emptiness check.
 *
 * **Performance**: O(1) space. O(n) time (passes all elements through).
 *
 * **Operator Category**: Streaming - deferred execution, no buffering.
 *
 * **Registration method**: TC39 `@operator()` class decorator.
 *
 * This method uses deferred execution. The source sequence is not read until the
 * returned sequence is iterated.
 *
 * @typeParam TSource - The type of elements in the sequence.
 *
 * @see {@link ITyneqEnumerable.defaultIfEmpty} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
@operator('defaultIfEmpty')
export class DefaultIfEmptyOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    /** The default value to yield if the source sequence is empty. */
    private readonly defaultValue: TSource;

    /**
     * Creates a new defaultIfEmpty operator.
     *
     * @param source - The source sequence.
     * @param defaultValue - The value to yield when the source is empty.
     */
    public constructor(source: IEnumerable<TSource>, defaultValue: TSource) {
        super(source);
        this.defaultValue = defaultValue;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        const source = this.source;
        const defaultValue = this.defaultValue;

        return (function* (): Generator<TSource> {
            const enumerator = source[Symbol.iterator]();
            const first = enumerator.next();

            if (first.done) {
                yield defaultValue;
                return;
            }

            yield first.value;
            let current = enumerator.next();
            while (!current.done) {
                yield current.value;
                current = enumerator.next();
            }
        })() as unknown as IEnumerator<TSource>;
    }
}
