import { IEnumerable, IEnumerator, IteratorFactory } from "../..";
import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { SelectEnumerator } from "../../enumerators/streaming/select";

export class SelectOperatorEnumerable<TSource, TResult> extends TyneqOperatorEnumerable<TSource, TResult> {
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

    public override getEnumerator(): IEnumerator<TResult> {
        return new SelectEnumerator<TSource, TResult>(this.source[Symbol.iterator](), this.selector);
    }
}