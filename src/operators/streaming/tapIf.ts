import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { TapIfEnumerator } from "../../enumerators/streaming/tapIf";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class TapIfOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
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
            return new TapIfEnumerator<TSource>(source[Symbol.iterator](), action, predicate);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new TapIfEnumerator<TSource>(this.source[Symbol.iterator](), this.action, this.predicate);
    }
}