import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { TapEnumerator } from "../../enumerators/streaming/tap";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class TapOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
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

    public override getEnumerator(): IEnumerator<TSource> {
        return new TapEnumerator<TSource>(this.source[Symbol.iterator](), this.action);
    }
}