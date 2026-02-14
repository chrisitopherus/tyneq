import { IEnumerable, IEnumerator, IteratorFactory } from "../..";
import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { PopulateEnumerator } from "../../enumerators/streaming/populate";

export class PopulateOperatorEnumerable<TSource, TValue> extends TyneqOperatorEnumerable<TSource, TValue> {
    private readonly value: TValue;

    public constructor(source: IEnumerable<TSource>, value: TValue) {
        super(source);
        this.value = value;
    }

    public getFactory(): IteratorFactory<TValue> {
        const source = this.source;
        const value = this.value;
        
        return () => {
            return new PopulateEnumerator<TSource, TValue>(source[Symbol.iterator](), value);
        }
    }

    public override getEnumerator(): IEnumerator<TValue> {
        return new PopulateEnumerator<TSource, TValue>(this.source[Symbol.iterator](), this.value);
    }
}