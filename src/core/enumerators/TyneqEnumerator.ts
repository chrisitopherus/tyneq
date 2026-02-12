import { IEnumerator } from '../../types/core';
import { ArgumentUtility } from '../../utility/argumentUtility';
import { EnumeratorUtility } from '../../utility/EnumeratorUtility';
import { nameof } from '../../utility/nameof';

export abstract class TyneqEnumerator<TInput, TOutput = TInput> implements IEnumerator<TOutput> {
    private sourceDisposed = false;
    private completed = false;
    protected readonly sourceEnumerator: IEnumerator<TInput>;

    public constructor(sourceEnumerator: IEnumerator<TInput>) {
        ArgumentUtility.checkNotOptional(sourceEnumerator, nameof({ sourceEnumerator }));

        this.sourceEnumerator = sourceEnumerator;
    }

    public next(): IteratorResult<TOutput> {
        if (this.completed) return this.done();

        const result = this.handleNext();

        if (result.done) {
            this.completed = true;
            return this.done();
        }

        return result;
    }

    public return(value?: unknown): IteratorResult<TOutput> {
        this.dispose(value);
        this.completed = true;
        return this.done();
    }

    protected yield(value: TOutput): IteratorResult<TOutput> {
        return { done: false, value };
    }

    protected done(): IteratorResult<TOutput> {
        return { done: true, value: undefined };
    }

    protected doneWithYield(value: TOutput): IteratorResult<TOutput> {
        this.completed = true;
        return this.yield(value);
    }

    protected earlyComplete(reason?: unknown): IteratorResult<TOutput> {
        this.dispose(reason);
        this.completed = true;
        return this.done();
    }

    protected dispose(value?: unknown): void {
        this.disposeSource();
        this.disposeAdditional(value);
    }

    protected disposeSource(): void {
        if (this.sourceDisposed) return;

        this.sourceDisposed = true;
        EnumeratorUtility.tryDispose(this.sourceEnumerator);
    }

    protected disposeAdditional(value?: unknown): void { }

    protected abstract handleNext(): IteratorResult<TOutput>;
}