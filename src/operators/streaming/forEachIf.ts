import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { ForEachIfEnumerator } from "../../enumerators/streaming/forEachIf";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class ForEachIfOperator<TSource> extends TyneqOperator<TSource> {
    private readonly action: (item: TSource) => void;
    private readonly predicate: () => boolean;

    public constructor(source: IEnumerable<TSource>, action: (item: TSource) => void, predicate: () => boolean) {
        super(source);
        this.action = action;
        this.predicate = predicate;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const action = this.action;
        const predicate = this.predicate;
        return () => {
            return new ForEachIfEnumerator<TSource>(source, action, predicate);
        }
    }
}