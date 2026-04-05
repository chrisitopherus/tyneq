import { Factory, Maybe } from "../types/utility";

/**
 * Utility class for lazy initialization of values.
 *
 * @group Utilities
 */
export class Lazy<T> {
    /** The lazily initialized value, or `undefined` if not yet initialized. */
    private lazyValue: Maybe<T> = undefined;
    /** Indicates whether the value has been initialized. */
    private initialized = false;

    public constructor(private readonly factory: Factory<T, []>) { }

    /** Returns the lazily initialized value, initializing it if necessary. */
    public get value(): T {
        if (!this.initialized) {
            this.lazyValue = this.factory();
            this.initialized = true;
        }

        return this.lazyValue!;
    }
}