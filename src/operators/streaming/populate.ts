import { IEnumerable, IteratorFactory } from "../..";
import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { PopulateEnumerator } from "../../enumerators/streaming/populate";

export class PopulateOperator<TSource, TValue> extends TyneqOperator<TSource, TValue> {
    private readonly generator: (item: TSource) => TValue;

    public constructor(source: IEnumerable<TSource>, generator: (item: TSource) => TValue) {
        super(source);
        this.generator = generator;
    }

    public getFactory(): IteratorFactory<TValue> {
        const source = this.source;
        const generator = this.generator;
        
        return () => {
            return new PopulateEnumerator<TSource, TValue>(source[Symbol.iterator](), generator);
        }
    }

}