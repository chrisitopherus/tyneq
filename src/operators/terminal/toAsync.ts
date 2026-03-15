import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { terminal } from '../../extensibility/operatorDecorators';
import { ITyneqEnumerable } from "../../types/core";

/**
 * Terminal operator that wraps a sequence as a native `AsyncIterable`, enabling
 * `for await...of` consumption and piping to async sinks.
 *
 * @remarks
 * Deferred. The source is not enumerated until the returned `AsyncIterable` is iterated.
 * Each iteration of the returned `AsyncIterable` produces a fresh traversal of the source.
 *
 * @see {@link ITyneqEnumerable.toAsync} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@terminal('toAsync')
export class ToAsyncOperator<TSource> extends TyneqTerminalOperator<TSource, AsyncIterable<TSource>> {
    /**
     * @param source - The source sequence.
     */
    public constructor(source: ITyneqEnumerable<TSource>) {
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
