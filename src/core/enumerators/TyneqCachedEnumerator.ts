import { CachedEnumerable } from "../../types/core";
import { TyneqBaseEnumerator } from "./TyneqBaseEnumerator";

/**
 * Base class for enumerators that need the full cached sequence (not just an Enumerator<T>).
 * Lifecycle of the source is owned by the sequence, not the enumerator.
 *
 * @group Plugin
 * @internal
 */
export abstract class TyneqCachedEnumerator<TSource> extends TyneqBaseEnumerator<TSource> {

    public constructor(protected readonly cachedSource: CachedEnumerable<TSource>) {
        super();
    }

    protected override disposeSource(): void {
        // The sequence owns its own lifecycle - enumerator must not dispose it.
    }
}