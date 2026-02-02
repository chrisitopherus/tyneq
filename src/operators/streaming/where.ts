import { IEnumerable, IteratorFactory } from "../..";
import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { WhereEnumerator } from "../../enumerators/streaming/where";

export class WhereOperator<TSource> extends TyneqOperator<TSource> {
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

}