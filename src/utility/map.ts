/**
 * A `Map` subclass with helpers for common get-or-initialize and set-or-update patterns.
 *
 * @remarks
 * Used internally by grouping and set operators that need to accumulate values per key.
 * Inherits the full native `Map<TKey, TValue>` API.
 *
 * @typeParam TKey   - The key type.
 * @typeParam TValue - The value type.
 *
 * @group Utilities
 * @internal
 */
export class TyneqMap<TKey, TValue> extends Map<TKey, TValue> {

    /**
     * Returns the value for `key` if it exists; otherwise initializes it with `initValue()`,
     * stores it, and returns the new value.
     *
     * @param key       - The key to look up.
     * @param initValue - Factory called once when `key` is absent. Must return the initial value.
     * @returns The existing or newly initialized value for `key`.
     */
    public getOrInit(key: TKey, initValue: () => TValue): TValue {
        let value = this.get(key);

        if (value === undefined) {
            value = initValue();
            this.set(key, value);
        }

        return value;
    }

    /**
     * If `key` does not exist, stores `initValue`. If it does exist, replaces it with the
     * return value of `updateValue(currentValue)`.
     *
     * @param key         - The key to update.
     * @param updateValue - Called with the current value when the key already exists.
     *   Returns the replacement value.
     * @param initValue   - The value to store when the key is absent.
     */
    public setOrUpdate(key: TKey, updateValue: (currentValue: TValue) => TValue, initValue: TValue): void {
        const currentValue = this.get(key);
        if (currentValue === undefined) {
            this.set(key, initValue);
            return;
        }

        const newValue = updateValue(currentValue);
        this.set(key, newValue);
    }
}