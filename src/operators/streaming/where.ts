import { IEnumerable, IEnumerator, IteratorFactory } from "../..";
import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { WhereEnumerator } from "../../enumerators/streaming/where";

export class WhereOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    private readonly predicate: (item: TSource) => boolean;

    public constructor(source: IEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        this.predicate = predicate;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const predicate = this.predicate;
        
        return () => {
            return new WhereEnumerator<TSource>(source[Symbol.iterator](), predicate);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new WhereEnumerator<TSource>(this.source[Symbol.iterator](), this.predicate);
    }
}