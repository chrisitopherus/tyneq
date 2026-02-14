import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { TapEnumerator } from "../../enumerators/streaming/tap";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class TapOperator<TSource> extends TyneqOperator<TSource> {
    private readonly action: (item: TSource) => void;

    public constructor(source: IEnumerable<TSource>, action: (item: TSource) => void) {
        super(source);
        this.action = action;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const action = this.action;

        return () => {
            return new TapEnumerator<TSource>(source[Symbol.iterator](), action);
        }
    }
}