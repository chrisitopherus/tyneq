import { createGeneratorOperator } from '../../extensibility/createOperator';

/**
 * Places a delimiter element between every pair of consecutive source elements.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * The first and last elements are never preceded or followed by the delimiter. The result
 * length is `2 * sourceLength - 1` for a non-empty source.
 *
 * @see {@link ITyneqEnumerable.intersperse} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
createGeneratorOperator({
    name: 'intersperse',
    *generator(source: Iterable<unknown>, delimiter: unknown): IterableIterator<unknown> {
        let first = true;
        for (const item of source) {
            if (!first) yield delimiter;
            yield item;
            first = false;
        }
    }
});
