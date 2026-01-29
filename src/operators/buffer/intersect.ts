import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { IntersectEnumerator } from "../../enumerators/buffer/intersect";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class IntersectOperator<TSource> extends TyneqOperator<TSource> {
    private readonly intersectedValues: IEnumerable<TSource>;
    public constructor(source: IEnumerable<TSource>, intersectedValues: IEnumerable<TSource>) {
        super(source);
        this.intersectedValues = intersectedValues;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const intersectedValues = this.intersectedValues;
        return () => {
            return new IntersectEnumerator<TSource>(source[Symbol.iterator](), intersectedValues);
        }
    }
}