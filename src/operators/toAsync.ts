import { builtinTerminal } from "../extensions/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";

/**
 * Terminal operator that wraps a sequence as a native `AsyncIterable`, enabling
 * `for await...of` consumption and piping to async sinks.
 *
 * @remarks
 * Deferred. The source is not enumerated until the returned `AsyncIterable` is iterated.
 * Each iteration of the returned `AsyncIterable` produces a fresh traversal of the source.
 *
 * @see {@link TyneqSequence.toAsync} for the public API.
 *
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "toAsync" })
export class ToAsyncOperator<TSource> extends TyneqTerminalOperator<TSource, AsyncIterable<TSource>> {
    /**
     * @param source - The source sequence.
     */
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