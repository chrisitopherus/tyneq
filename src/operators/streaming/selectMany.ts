import { IEnumerable, IteratorFactory } from "../..";
import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { SelectManyEnumerator } from "../../enumerators/streaming/selectMany";

export class SelectManyOperator<TSource, TResult> extends TyneqOperator<TSource, TResult> {
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

}