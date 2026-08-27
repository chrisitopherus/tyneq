import { TyneqTerminalOperator } from "../core/terminal/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";

/**
 * Wraps the source sequence as an async iterable.
 *
 * @remarks
 * Deferred. The source is enumerated lazily as the returned async iterable is iterated.
 *
 * @see {@link TyneqSequence.toAsync}
 * @group Operators
 * @category Terminal
 * @internal
 */
export class ToAsyncOperator<TSource> extends TyneqTerminalOperator<TSource, AsyncIterable<TSource>> {

    public constructor(source: TyneqSequence<TSource>) {
        super(source);
    }

    public process(): AsyncIterable<TSource> {
        const source = this.source;
        return {
            async *[Symbol.asyncIterator]() {
                for (const item of source) {
                    yield item;
                }
            }
        };
    }
}