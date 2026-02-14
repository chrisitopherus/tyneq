import { IEnumerable, IEnumerator, IteratorFactory } from "../..";
import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { SelectManyEnumerator } from "../../enumerators/streaming/selectMany";

export class SelectManyOperatorEnumerable<TSource, TResult> extends TyneqOperatorEnumerable<TSource, TResult> {
    private readonly selector: (item: TSource) => IEnumerable<TResult>;

    public constructor(source: IEnumerable<TSource>, selector: (item: TSource) => IEnumerable<TResult>) {
        super(source);
        this.selector = selector;
    }

    public getFactory(): IteratorFactory<TResult> {
        const source = this.source;
        const selector = this.selector;

        return () => {
            return new SelectManyEnumerator<TSource, TResult>(source[Symbol.iterator](), selector);
        }
    }

    public override getEnumerator(): IEnumerator<TResult> {
        return new SelectManyEnumerator<TSource, TResult>(this.source[Symbol.iterator](), this.selector);
    }
}