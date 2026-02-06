import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { SplitEnumerator } from "../../enumerators/streaming/split";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class SplitOperator<TSource> extends TyneqOperator<TSource, TSource[]> {
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
}