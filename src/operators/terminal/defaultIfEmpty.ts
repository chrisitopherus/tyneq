import { Tyneq } from "../..";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { IEnumerator, ITyneqEnumerable } from "../../types/core";

export class DefaultIfEmptyOperator<TSource> extends TyneqTerminalOperator<TSource, ITyneqEnumerable<TSource>> {
    private readonly defaultValue: TSource;

    public constructor(source: ITyneqEnumerable<TSource>, defaultValue: TSource) {
        super(source);
        this.defaultValue = defaultValue;
    }
    public process(): ITyneqEnumerable<TSource> {
        const enumerator: IEnumerator<TSource> = this.source[Symbol.iterator]();
        const { done } = enumerator.next();

        if (done) {
            return Tyneq.from([this.defaultValue]);
        }

        // assertion is safe here because we assign an ITyneqEnumerable<TSource> in the constructor.
        return this.source as ITyneqEnumerable<TSource>;
    }

}