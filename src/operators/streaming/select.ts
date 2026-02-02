import { IEnumerable, IteratorFactory } from "../..";
import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { SelectEnumerator } from "../../enumerators/streaming/select";

export class SelectOperator<TSource, TResult> extends TyneqOperator<TSource, TResult> {
    private readonly selector: (item: TSource) => TResult

    public constructor(source: IEnumerable<TSource>, selector: (item: TSource) => TResult) {
        super(source);
        this.selector = selector;
    }

    public getFactory(): IteratorFactory<TResult> {
        const source = this.source;
        const selector = this.selector;

        return () => {
            return new SelectEnumerator<TSource, TResult>(source[Symbol.iterator](), selector);
        }
    }

}