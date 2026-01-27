import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { AppendEnumerator } from "../../enumerators/streaming/append";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class AppendOperator<TSource> extends TyneqOperator<TSource> {
    private readonly element: TSource;

    public constructor(source: IEnumerable<TSource>, element: TSource) {
        super(source);
        this.element = element;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const element = this.element;
        
        return () => {
            return new AppendEnumerator<TSource>(source[Symbol.iterator](), element);
        }
    }
}