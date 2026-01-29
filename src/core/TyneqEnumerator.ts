import { EnumeratorResult, EnumeratorResultKind, EnumeratorCompleteResult, EnumeratorYieldResult, IEnumerator } from '../types/core';
import { TyneqIteratorResult } from './TyneqIteratorResult';

export abstract class TyneqEnumerator<TInput, TOutput = TInput> implements IEnumerator<TOutput> {
    private completed = false;
    protected readonly sourceEnumerator: IEnumerator<TInput>;

    public constructor(sourceEnumerator: IEnumerator<TInput>) {
        this.sourceEnumerator = sourceEnumerator;
    }

    public next(): IteratorResult<TOutput> {
        if (this.completed) {
            return this.toIteratorComplete();
        }

        const result = this.handleNext();

        switch (result.kind) {
            case EnumeratorResultKind.Yield:
                return this.toIteratorYield(result.value);
            case EnumeratorResultKind.Complete:
                this.completed = true;
                return this.toIteratorComplete();
            default: throw new Error(`Unknown EnumeratorResult kind: ${(result as any).kind}`);
        }
    }

    protected yield(value: TOutput): EnumeratorYieldResult<TOutput> {
        return {
            kind: EnumeratorResultKind.Yield,
            value: value
        };
    }


    protected complete(): EnumeratorCompleteResult<null> {
        return {
            kind: EnumeratorResultKind.Complete,
            value: null
        };
    }

    private toIteratorYield(value: TOutput): IteratorResult<TOutput> {
        return TyneqIteratorResult.yield(value);
    }

    private toIteratorComplete(): IteratorResult<TOutput> {
        this.completed = true;
        return TyneqIteratorResult.complete();
    }

    protected abstract handleNext(): EnumeratorResult<TOutput>;
}