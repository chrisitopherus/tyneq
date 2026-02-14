import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ConcatEnumerator } from "../../enumerators/streaming/concat";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class ConcatOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
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

    public override getEnumerator(): IEnumerator<TSource> {
        return new ConcatEnumerator<TSource>(this.source[Symbol.iterator](), this.other[Symbol.iterator]());
    }
}