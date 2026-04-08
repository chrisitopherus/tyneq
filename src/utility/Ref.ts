/**
 * Represents a reference to a value of type `T`, allowing both retrieval and assignment.
 * 
 * @group Utilities
 */
export class Ref<T> {
    public constructor(
        private readonly getter: () => T,
        private readonly setter: (value: T) => void
    ) { }

    /** Gets the current value of the reference. */
    public get value(): T {
        return this.getter();
    }

    /** Sets the value of the reference. */
    public set value(v: T) {
        this.setter(v);
    }
}