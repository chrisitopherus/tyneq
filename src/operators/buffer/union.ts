import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { UnionEnumerator } from "../../enumerators/buffer/union";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class UnionOperator<TSource> extends TyneqOperator<TSource> {
    private readonly otherValues: IEnumerable<TSource>;
    public constructor(source: IEnumerable<TSource>, otherValues: IEnumerable<TSource>) {
        super(source);
        this.otherValues = otherValues;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const otherValues = this.otherValues;
        return () => {
            return new UnionEnumerator<TSource>(source[Symbol.iterator](), otherValues);
        }
    }
}