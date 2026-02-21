import { IEnumerable, IEnumerator } from '../../types/core';
import { ArgumentUtility } from '../../utility/argumentUtility';
import { nameof } from '../../utility/nameof';
export class EnumerableAdapter<TSource> implements IEnumerable<TSource> {
    private readonly iterable: Iterable<TSource>;
    public constructor(iterable: Iterable<TSource>) {
        ArgumentUtility.checkNotOptional(iterable, nameof({ iterable }));
        ArgumentUtility.checkIterable(iterable, nameof({ iterable }));

        this.iterable = iterable;
    }

    public [Symbol.iterator](): IEnumerator<TSource> {
        return this.getEnumerator();
    }
    
    public getEnumerator(): IEnumerator<TSource> {
        return this.iterable[Symbol.iterator]();
    }
}