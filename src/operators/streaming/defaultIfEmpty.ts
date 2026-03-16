import { createGeneratorOperator } from "../../extensibility/createGeneratorOperator";

/**
 * Yields all source elements, or a single default value if the source is empty.
 *
 * @remarks
 * Deferred. Source is not enumerated until the returned sequence is iterated.
 *
 * @see {@link ITyneqEnumerable.defaultIfEmpty} for the public API.
 *
 * @group Operators
 * @category Streaming
 * @internal
 */
createGeneratorOperator({
    name: "defaultIfEmpty",
    source: "internal",
    *generator(source: Iterable<unknown>, defaultValue: unknown): IterableIterator<unknown> {
        let hasElements = false;
        for (const item of source) {
            hasElements = true;
            yield item;
        }
        if (!hasElements) yield defaultValue;
    }
});
