import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { BacksertEnumerator } from "../../enumerators/buffer/backsert";
import { IEnumerable, IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class BacksertOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    private readonly other: Iterable<TSource>;
    private readonly index: number;

    public constructor(source: IEnumerable<TSource>, other: Iterable<TSource>, index: number) {
        super(source);
        ArgumentUtility.checkNotOptional(other, nameof({ other }));
        ArgumentUtility.checkNonNegative(index, nameof({ index }));
        ArgumentUtility.checkInteger(index, nameof({ index }));

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
