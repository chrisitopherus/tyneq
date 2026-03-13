import { createGeneratorOperator } from '../../extensibility/createOperator';

/**
 * Yields all source elements, or a single default value if the source is empty.
 *
 * @remarks
 * This method uses deferred execution. The source sequence is not enumerated until the returned sequence is iterated.
 *
 * @see {@link ITyneqEnumerable.defaultIfEmpty} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
createGeneratorOperator({
    name: 'defaultIfEmpty',
    *generator(source: Iterable<unknown>, defaultValue: unknown): IterableIterator<unknown> {
        let hasElements = false;
        for (const item of source) {
            hasElements = true;
            yield item;
        }
        if (!hasElements) yield defaultValue;
    }
});
