import { Factory, Maybe } from "../types/utility";

/**
 * Utility class for lazy initialization of values.
 *
 * @group Utilities
 */
export class Lazy<T> {
    /** The lazily initialized value, or `undefined` if not yet initialized. */
    private _value: Maybe<T> = undefined;
    /** Indicates whether the value has been initialized. */
    private _initialized = false;

    public constructor(private readonly factory: Factory<T, []>) { }

    /** Returns the lazily initialized value, initializing it if necessary. */
    public get value(): T {
        if (!this._initialized) {
            this._value = this.factory();
            this._initialized = true;
        }

        return this._value!;
    }
}