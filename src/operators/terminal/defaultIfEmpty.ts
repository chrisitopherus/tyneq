import { createGeneratorOperator } from '../../extensibility/createOperator';

/**
 * Yields all source elements, or a single default value if the source is empty.
 *
 * @remarks
 * **Performance**: O(1) space (streaming generator). O(n) time.
 *
 * **Operator Category**: Streaming - deferred execution, no buffering.
 *
 * **Registration method**: `createGeneratorOperator()`.
 *
 * This method uses deferred execution. The source sequence is not read until the
 * returned sequence is iterated.
 *
 * @see {@link ITyneqEnumerable.defaultIfEmpty} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
createGeneratorOperator<any, any, [any]>({
    name: 'defaultIfEmpty',
    *generator(source: Iterable<any>, defaultValue: any): IterableIterator<any> {
        let hasElements = false;
        for (const item of source) {
            hasElements = true;
            yield item;
        }
        if (!hasElements) yield defaultValue;
    }
});
