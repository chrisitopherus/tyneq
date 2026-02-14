import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ExceptEnumerator } from "../../enumerators/buffer/except";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class ExceptOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    private readonly excludedValues: IEnumerable<TSource>;
    public constructor(source: IEnumerable<TSource>, excludedValues: IEnumerable<TSource>) {
        super(source);
        ArgumentUtility.checkNotOptional(excludedValues, nameof({ excludedValues }));

        this.excludedValues = excludedValues;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const excludedValues = this.excludedValues;
        return () => {
            return new ExceptEnumerator<TSource>(source[Symbol.iterator](), excludedValues);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new ExceptEnumerator<TSource>(this.source[Symbol.iterator](), this.excludedValues);
    }
}