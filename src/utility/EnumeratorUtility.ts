import { IEnumerator } from "../types/core";
import { Optional } from '../types/utility';

export class EnumeratorUtility {
    private constructor() { }

    public static tryDispose<TSource>(enumerator: Optional<IEnumerator<TSource>>): void {
        const enumeratorReturnFunc = enumerator?.return;
        if (!enumeratorReturnFunc) return;

        try {
            enumeratorReturnFunc.call(enumerator);
        } catch {
            // swallow
        }
    }

    public static toIterable<TSource>(enumerator: IEnumerator<TSource>): Iterable<TSource> {
        return {
            [Symbol.iterator]: () => enumerator
        };
    }
}