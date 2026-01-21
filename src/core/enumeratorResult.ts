export class EnumeratorResult<T> {
    public readonly value: T | undefined;
    public readonly done: boolean;

    private constructor(value: T | undefined, done: boolean) {
        this.value = value;
        this.done = done;
    }

    public static yield<T>(value: T): IteratorResult<T> {
        return new EnumeratorResult(value, false) as IteratorResult<T>;
    }

    public static done<T = any>(): IteratorResult<T> {
        return new EnumeratorResult(undefined, true) as IteratorResult<T>;
    }
}