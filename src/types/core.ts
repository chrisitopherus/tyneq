/**
 * An enumerator that iterates over a sequence of T.
 */
export type IEnumerator<T> = Iterator<T>;

/**
 * An enumerable sequence of T.
 * 
 * ~ Iterable<T>.
 */
export interface IEnumerable<T> extends Iterable<T> {
    /**
     * Returns an enumerator that iterates through the collection.
     * 
     * Like: GetEnumerator() in C#.
     */
    [Symbol.iterator](): IEnumerator<T>;
}

/**
 * A factory function that creates a new IEnumerator<T>.
 * 
 * This is used to ensure that IEnumerable<T> implementations are re-iterable, because `JS generators` are not.
 */
export type IteratorFactory<T> = () => IEnumerator<T>;