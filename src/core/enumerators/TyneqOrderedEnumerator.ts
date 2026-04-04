import { OrderedEnumerable } from "../../types/core";
import { TyneqBaseEnumerator } from "./TyneqBaseEnumerator";

/**
 * Base class for enumerators that need the full ordered sequence (not just an Enumerator<T>).
 * Lifecycle of the source is owned by the sequence, not the enumerator.
 *
 * @group Plugin
 */
export abstract class TyneqOrderedEnumerator<TSource> extends TyneqBaseEnumerator<TSource> {

    public constructor(protected readonly orderedSource: OrderedEnumerable<TSource>) {
        super();
    }

    protected override disposeSource(): void {
        // The sequence owns its own lifecycle — enumerator must not dispose it.
    }
}