import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { IntersectEnumerator } from "../../enumerators/buffer/intersect";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class IntersectOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource> {
    private readonly intersectedValues: IEnumerable<TSource>;
    public constructor(source: IEnumerable<TSource>, intersectedValues: IEnumerable<TSource>) {
        super(source);
        ArgumentUtility.checkNotOptional(intersectedValues, nameof({ intersectedValues }));
        
        this.intersectedValues = intersectedValues;
    }

    public getFactory(): IteratorFactory<TSource> {
        const source = this.source;
        const intersectedValues = this.intersectedValues;
        return () => {
            return new IntersectEnumerator<TSource>(source[Symbol.iterator](), intersectedValues);
        }
    }

    public override getEnumerator(): IEnumerator<TSource> {
        return new IntersectEnumerator<TSource>(this.source[Symbol.iterator](), this.intersectedValues);
    }
}