import { TyneqEnumerator } from "../../core/enumerators/TyneqEnumerator";
import { IEnumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class ChunkEnumerator<T> extends TyneqEnumerator<T, T[]> {
    private readonly size: number;
    private currentChunk: T[] = [];

    public constructor(sourceEnumerator: IEnumerator<T>, size: number) {
        super(sourceEnumerator);
        ArgumentUtility.checkPositive(size, nameof({ size }));

        this.size = size;
    }

    protected override handleNext(): IteratorResult<T[]> {
        while (this.currentChunk.length < this.size) {
            const next = this.sourceEnumerator.next();
            if (next.done) break;
            this.currentChunk.push(next.value);
        }

        if (this.currentChunk.length === 0) {
            return this.done();
        }

        const chunk = this.currentChunk;
        this.currentChunk = [];
        return this.yield(chunk);
    }
}