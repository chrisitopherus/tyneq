import { IEnumerable, IteratorFactory } from "../types/core";
import { TyneqEnumerable } from "./enumerable";

export class Tyneq {
    public static from<T>(source: Iterable<T>): TyneqEnumerable<T> {
        const factory: IteratorFactory<T> = () => source[Symbol.iterator]();
        return new TyneqEnumerable<T>(factory);
    }
}