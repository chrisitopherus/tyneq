import { IEnumerable, IteratorFactory } from "../types/core";
import { Enumerable } from "./enumerable";

export class Tyneq {
    public static from<T>(source: Iterable<T>): Enumerable<T> {
        const factory: IteratorFactory<T> = () => source[Symbol.iterator]();
        return new Enumerable<T>(factory);
    }
}