import { IEnumerator } from '../types/core';
import { ArgumentUtility } from '../utility/argumentUtility';
import { nameof } from '../utility/nameof';
import { TyneqIteratorResult } from './TyneqIteratorResult';

export abstract class TyneqEnumerator<TInput, TOutput = TInput> implements IEnumerator<TOutput> {
    private completed = false;
    protected readonly sourceEnumerator: IEnumerator<TInput>;

    public constructor(sourceEnumerator: IEnumerator<TInput>) {
        ArgumentUtility.checkNotOptional(sourceEnumerator, nameof({ sourceEnumerator }));

        this.sourceEnumerator = sourceEnumerator;
    }

    public next(): IteratorResult<TOutput> {
        if (this.completed) {
            return TyneqIteratorResult.complete();
        }

        const result = this.handleNext();

        if (result.done) {
            this.completed = true;
            return TyneqIteratorResult.complete();
        }

        return TyneqIteratorResult.yield(result.value);
    }

    protected yield(value: TOutput): IteratorResult<TOutput> {
        return {
            done: false,
            value: value
        }
    }


    protected complete(): IteratorResult<TOutput> {
        return {
            done: true,
            value: undefined
        };
    }

    protected abstract handleNext(): IteratorResult<TOutput>;
}