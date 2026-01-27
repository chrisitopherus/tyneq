import { Undefinedable } from "../types/utility";

export class TyneqIteratorResult<T> {
    public readonly value: T | undefined;
    public readonly done: boolean;

    private constructor(value: Undefinedable<T>, done: boolean) {
        this.value = value;
        this.done = done;
    }

    public static yield<T>(value: T): IteratorResult<T> {
        return new TyneqIteratorResult(value, false) as IteratorResult<T>;
    }

    public static complete<T = null>(): IteratorResult<T> {
        return new TyneqIteratorResult(null, true) as IteratorResult<T>;
    }
}