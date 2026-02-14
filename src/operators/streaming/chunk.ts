import { TyneqOperatorEnumerable } from "../../core/operator/TyneqOperatorEnumerable";
import { ChunkEnumerator } from "../../enumerators/streaming/chunk";
import { IEnumerable, IEnumerator, IteratorFactory } from "../../types/core";

export class ChunkOperatorEnumerable<TSource> extends TyneqOperatorEnumerable<TSource, TSource[]> {
    private readonly size: number;

    public constructor(source: IEnumerable<TSource>, size: number) {
        super(source);
        this.size = size;
    }

    public getFactory(): IteratorFactory<TSource[]> {
        const source = this.source;
        const size = this.size;
        
        return () => {
            return new ChunkEnumerator<TSource>(source[Symbol.iterator](), size);
        }
    }

    public override getEnumerator(): IEnumerator<TSource[]> {
        return new ChunkEnumerator<TSource>(this.source[Symbol.iterator](), this.size);
    }
}