import { SequenceContainsNoElementsError } from "../core/errors/SequenceContainsNoElementsError";
import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { TyneqComparer } from "../core/TyneqComparer";
import { TyneqSequence, Comparer } from "../types/core";
import { ArgumentUtility } from "../utility/ArgumentUtility";
import { Nullable } from "../types/utility";

/**
 * Comparison direction for extremum operators.
 *
 * - `1` selects the maximum (comparer result > 0 means replacement).
 * - `-1` selects the minimum (comparer result < 0 means replacement).
 *
 * @internal
 */
type ExtremumDirection = 1 | -1;

/**
 * Returns the minimum or maximum element in the sequence using a comparer.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 * Parameterised by direction to avoid duplicating the iteration logic
 * across separate min and max operators.
 *
 * @see {@link TyneqSequence.min}
 * @see {@link TyneqSequence.max}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ExtremumOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly comparer: Comparer<TSource>;
    private readonly direction: ExtremumDirection;
    private readonly operatorName: string;

    public constructor(
        source: TyneqSequence<TSource>,
        direction: ExtremumDirection,
        operatorName: string,
        comparer?: Comparer<TSource>
    ) {
        super(source);
        this.comparer = comparer ?? TyneqComparer.defaultComparer;
        this.direction = direction;
        this.operatorName = operatorName;
    }

    public process(): TSource {
        let best: Nullable<TSource> = null;
        let hasElement = false;

        for (const element of this.source) {
            if (!hasElement || this.comparer(element, best!) * this.direction > 0) {
                best = element;
                hasElement = true;
            }
        }

        if (!hasElement) {
            throw new SequenceContainsNoElementsError(this.operatorName);
        }

        return best as TSource;
    }
}

/**
 * Returns the element with the minimum or maximum key as determined by a key selector.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 * Parameterised by direction to avoid duplicating the iteration logic
 * across separate minBy and maxBy operators.
 *
 * @see {@link TyneqSequence.minBy}
 * @see {@link TyneqSequence.maxBy}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ExtremumByOperator<TSource, TKey> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly comparer: Comparer<TKey>;
    private readonly keySelector: (element: TSource) => TKey;
    private readonly direction: ExtremumDirection;
    private readonly operatorName: string;

    public constructor(
        source: TyneqSequence<TSource>,
        keySelector: (element: TSource) => TKey,
        direction: ExtremumDirection,
        operatorName: string,
        comparer?: Comparer<TKey>
    ) {
        super(source);
        ArgumentUtility.checkNotOptional({ keySelector });
        this.comparer = comparer ?? TyneqComparer.defaultComparer;
        this.keySelector = keySelector;
        this.direction = direction;
        this.operatorName = operatorName;
    }

    public process(): TSource {
        let bestElement: Nullable<TSource> = null;
        let bestKey: Nullable<TKey> = null;
        let hasElement = false;

        for (const element of this.source) {
            const key = this.keySelector(element);
            if (!hasElement || this.comparer(key, bestKey!) * this.direction > 0) {
                bestElement = element;
                bestKey = key;
                hasElement = true;
            }
        }

        if (!hasElement) {
            throw new SequenceContainsNoElementsError(this.operatorName);
        }

        return bestElement as TSource;
    }
}
