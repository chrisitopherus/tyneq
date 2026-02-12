import { IEnumerator } from "../../types/core";

export abstract class TyneqGeneratorEnumerator<TOutput> implements IEnumerator<TOutput> {
    private completed = false;

    public next(): IteratorResult<TOutput> {
        if (this.completed) return this.complete();

        const result = this.handleNext();

        if (result.done) {
            this.completed = true;
        }

        return result;
    }

    protected yield(value: TOutput): IteratorResult<TOutput> {
        return { done: false, value };
    }

    protected complete(): IteratorResult<TOutput> {
        return { done: true, value: undefined };
    }

    protected abstract handleNext(): IteratorResult<TOutput>;
}