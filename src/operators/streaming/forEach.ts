import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { ForEachEnumerator } from "../../enumerators/streaming/forEach";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class ForEachOperator<TSource> extends TyneqOperator<TSource> {
    private readonly action: (item: TSource) => void;

    public constructor(source: IEnumerable<TSource>, action: (item: TSource) => void) {
        super(source);
        this.action = action;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const action = this.action;

        return () => {
            return new ForEachEnumerator<TSource>(source, action);
        }
    }
}