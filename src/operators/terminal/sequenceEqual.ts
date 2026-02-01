import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { TyneqComparer } from "../../core/TyneqComparer";
import { IEnumerable, ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class SequenceEqualOperator<TSource> extends TyneqTerminalOperator<TSource, boolean> {
    private readonly other: IEnumerable<TSource>;
    private readonly equalityComparer: (a: TSource, b: TSource) => boolean;

    public constructor(source: ITyneqEnumerable<TSource>, other: IEnumerable<TSource>, equalityComparer?: (a: TSource, b: TSource) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional(other, nameof({ other }));
        ArgumentUtility.checkNotNull(equalityComparer, nameof({ equalityComparer }));

        this.equalityComparer = equalityComparer ?? TyneqComparer.defaultEqualityComparer;
        this.other = other;
    }

    public process(): boolean {
        const sourceIterator = this.source[Symbol.iterator]();
        const otherIterator = this.other[Symbol.iterator]();

        while (true) {
            const sourceNext = sourceIterator.next();
            const otherNext = otherIterator.next();

            if (sourceNext.done && otherNext.done) {
                break;
            }

            if (sourceNext.done !== otherNext.done) {
                return false;
            }

            if (!this.equalityComparer(sourceNext.value, otherNext.value)) {
                return false;
            }
        }

        return true;
    }
}