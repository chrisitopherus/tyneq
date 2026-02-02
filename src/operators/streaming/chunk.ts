import { TyneqOperator } from "../../core/operator/TyneqOperator";
import { ChunkEnumerator } from "../../enumerators/streaming/chunk";
import { IEnumerable, IteratorFactory } from "../../types/core";

export class ChunkOperator<TSource> extends TyneqOperator<TSource, TSource[]> {
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
}