import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { UnionEnumerator } from "../../enumerators/buffer/union";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class UnionOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    private readonly otherValues: IEnumerable<TSource>;
    public constructor(source: IEnumerable<TSource>, otherValues: IEnumerable<TSource>) {
        super(source);
        ArgumentUtility.checkNotOptional(otherValues, nameof({ otherValues }));

        this.otherValues = otherValues;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const otherValues = this.otherValues;
        return () => {
            return new UnionEnumerator<TSource>(source[Symbol.iterator](), otherValues);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new UnionEnumerator<TSource>(this.source[Symbol.iterator](), this.otherValues);
    }
}