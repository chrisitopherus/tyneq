import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { BacksertEnumerator } from "../../enumerators/buffer/backsert";
import { IEnumerable, IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

/**
 * Operator implementation for inserting elements at a position from the end of a sequence.
 *
 * @remarks
 * This is a buffering operator that inserts elements from another sequence at the specified
 * index counted from the back of the source sequence. Delegates the actual enumeration
 * logic to {@link BacksertEnumerator}.
 *
 * **Performance**: O(n) time, O(n) space. Must buffer all source elements to determine
 * the insertion position from the end.
 *
 * **Operator Category**: Buffering - materializes the source sequence to resolve the
 * back-relative insertion index.
 *
 * This method uses deferred execution. The source sequence is fully buffered on first iteration of the returned sequence.
 *
 * @typeParam TSource - The type of elements in the sequences.
 *
 * @see {@link BacksertEnumerator} for the enumeration implementation.
 * @see {@link ITyneqEnumerable.backsert} for the public API.
 *
 * @group Operators
 * @category Buffering
 * @internal
 */
export class BacksertOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    private readonly other: Iterable<TSource>;
    private readonly index: number;

    public constructor(source: IEnumerable<TSource>, other: Iterable<TSource>, index: number) {
        super(source);
        
        this.other = other;
        this.index = index;
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new BacksertEnumerator<TSource>(
            this.source[Symbol.iterator](),
            this.other[Symbol.iterator](),
            this.index
        );
    }
}
