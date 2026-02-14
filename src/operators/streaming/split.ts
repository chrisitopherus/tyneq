import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { SplitEnumerator } from "../../enumerators/streaming/split";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class SplitOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource, TSource[]> {
    private readonly predicate: (item: TSource) => boolean;

    public constructor(source: IEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        this.predicate = predicate;
    }

    public getFactory(): IteratorFactory<TSource[]> {
        const source = this.source;
        const predicate = this.predicate;

        return () => {
            return new SplitEnumerator<TSource>(source[Symbol.iterator](), predicate);
        }
    }

    public override getEnumerator(): IEnumerator<TSource[]> {
        return new SplitEnumerator<TSource>(this.source[Symbol.iterator](), this.predicate);
    }
}