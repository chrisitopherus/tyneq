/**
 * `Map` subclass with convenience helpers for initialise-on-first-access patterns.
 *
 * @internal
 */
export class DefaultingMap<TKey, TValue> extends Map<TKey, TValue> {

    /** Returns the value for `key`, or initialises and stores it via `initValue()` if absent. */
    public getOrInit(key: TKey, initValue: () => TValue): TValue {
        if (!this.has(key)) {
            this.set(key, initValue());
        }

        return this.get(key) as TValue;
    }

    /** Sets `key` to `initValue` if absent; otherwise replaces the current value with `updateValue(current)`. */
    public setOrUpdate(key: TKey, updateValue: (currentValue: TValue) => TValue, initValue: TValue): void {
        if (!this.has(key)) {
            this.set(key, initValue);
            return;
        }

        this.set(key, updateValue(this.get(key) as TValue));
    }
}
