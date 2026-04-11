import { Enumerator } from "../../types/core";
import { ArgumentUtility } from "../../utility/ArgumentUtility";
import { EnumeratorUtility } from "../../utility/EnumeratorUtility";
import { TyneqBaseEnumerator } from "./TyneqBaseEnumerator";

/**
 * Base class for all pipeline operator enumerators (streaming and buffering).
 *
 * @remarks
 * Extends {@link TyneqBaseEnumerator} with a typed source enumerator.
 * Override `initialize()` to buffer or prepare state before the first `handleNext()`.
 * Override `disposeAdditional()` to release resources beyond the source enumerator.
 *
 * @typeParam TInput - Source element type.
 * @typeParam TOutput - Output element type (defaults to `TInput`).
 * @group Plugin
 */
export abstract class TyneqEnumerator<TInput, TOutput = TInput> extends TyneqBaseEnumerator<TInput, TOutput> {
    protected readonly sourceEnumerator: Enumerator<TInput>;

    public constructor(sourceEnumerator: Enumerator<TInput>) {
        super();
        ArgumentUtility.checkNotOptional({ sourceEnumerator });

        this.sourceEnumerator = sourceEnumerator;
    }

    protected override disposeSource(): void {
        if (this.sourceDisposed) {
            return;
        }

        this.sourceDisposed = true;
        EnumeratorUtility.tryDispose(this.sourceEnumerator);
    }
}
