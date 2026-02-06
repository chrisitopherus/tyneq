import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class StartsWithOperator<T> extends TyneqTerminalOperator<T, boolean> {
    private readonly sequence: IEnumerable<T>;

    public constructor(source: IEnumerable<T>, sequence: IEnumerable<T>) {
        super(source);
        ArgumentUtility.checkNotOptional(sequence, nameof({ sequence }));

        this.sequence = sequence;
    }

    public process(): boolean {
        const sourceEnumerator = this.source[Symbol.iterator]();
        const sequenceEnumerator = this.sequence[Symbol.iterator]();

        while (true) {
            const { value: sourceValue, done: sourceDone } = sourceEnumerator.next();
            const { value: sequenceValue, done: sequenceDone } = sequenceEnumerator.next();

            if (sequenceDone) {
                return true;
            }

            if (sourceDone || sourceValue !== sequenceValue) {
                return false;
            }
        }
    }
}