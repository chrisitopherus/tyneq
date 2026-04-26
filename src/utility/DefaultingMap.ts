
/**
 * `Map` subclass with convenience helpers for initialise-on-first-access patterns.
 *
 * @internal
 */
export class DefaultingMap<TKey, TValue> extends Map<TKey, TValue> {

    /** Returns the value for `key`, or initialises and stores it via `initValue()` if absent. */
    public getOrInit(key: TKey, initValue: () => TValue): TValue {
        let value = this.get(key);

        if (value === undefined) {
            value = initValue();
            this.set(key, value);
        }

        return value;
    }

    /** Sets `key` to `initValue` if absent; otherwise replaces the current value with `updateValue(current)`. */
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