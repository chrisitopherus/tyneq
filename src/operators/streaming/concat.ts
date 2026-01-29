import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { ConcatEnumerator } from "../../enumerators/streaming/concat";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class ConcatOperator<TSource> extends TyneqOperator<TSource> {
    private readonly other: IEnumerable<TSource>;

    public constructor(source: IEnumerable<TSource>, other: IEnumerable<TSource>) {
        super(source);
        this.other = other;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const other = this.other;

        return () => {
            return new ConcatEnumerator<TSource>(source[Symbol.iterator](), other[Symbol.iterator]());
        }
    }
}