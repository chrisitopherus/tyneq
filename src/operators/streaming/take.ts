import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { TakeEnumerator } from "../../enumerators/streaming/take";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class TakeOperator<TSource> extends TyneqOperator<TSource> {
    private readonly count: number;

    public constructor(source: IEnumerable<TSource>, count: number) {
        super(source);
        this.count = count;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const count = this.count;

        return () => {
            return new TakeEnumerator<TSource>(source[Symbol.iterator](), count);
        }
    }
}