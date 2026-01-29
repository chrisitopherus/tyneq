import { Undefinedable } from "../types/utility";

export class TyneqMap<TKey, TValue> extends Map<TKey, TValue> {

    public getOrInit(key: TKey, initValue: () => TValue): TValue {
        let value = this.get(key);

        if (value === undefined) {
            value = initValue();
            this.set(key, value);
        }

        return value;
    }

    public setOrUpdate(key: TKey, updateValue: (currentValue: Undefinedable<TValue>) => TValue): void {
        const currentValue = this.get(key);
        const newValue = updateValue(currentValue);
        this.set(key, newValue);
    }
}