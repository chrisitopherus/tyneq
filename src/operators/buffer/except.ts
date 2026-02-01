import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { ExceptEnumerator } from "../../enumerators/buffer/except";
import { IEnumerable, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class ExceptOperator<TSource> extends TyneqOperator<TSource> {
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
}