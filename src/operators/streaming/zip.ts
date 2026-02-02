import { IEnumerable, IteratorFactory } from "../..";
import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { ZipEnumerator } from "../../enumerators/streaming/zip";

export class ZipOperator<TSource, TOther, TResult> extends TyneqOperator<TSource, TResult> {
    private readonly other: IEnumerable<TOther>;
    private readonly selector: (first: TSource, second: TOther) => TResult;

    public constructor(source: IEnumerable<TSource>, other: IEnumerable<TOther>, selector: (first: TSource, second: TOther) => TResult) {
        super(source);
        this.other = other;
        this.selector = selector;
    }

    public getFactory(): IteratorFactory<TResult> {
        const source = this.source;
        const other = this.other;
        const selector = this.selector;

        return () => {
            return new ZipEnumerator<TSource, TOther, TResult>(source[Symbol.iterator](), other[Symbol.iterator](), selector);
        }
    }

}