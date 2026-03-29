import { builtinTerminal } from "../plugin/builtinTerminal";
import { TyneqTerminalOperator } from "../core/TyneqTerminalOperator";
import { TyneqSequence } from "../types/core";

/**
 * Wraps the source sequence as an async iterable.
 *
 * @remarks
 * Immediate. Source is fully enumerated when this method is called.
 *
 * @see {@link TyneqSequence.toAsync}
 * @group Operators
 * @category Terminal
 * @internal
 */
@builtinTerminal({ name: "toAsync" })
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