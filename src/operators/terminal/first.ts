import { InvalidOperationError } from "../../core/errors/InvalidOperationError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class FirstOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly predicate: (item: TSource) => boolean;

    public constructor(source: ITyneqEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional(predicate, nameof({ predicate }));

        this.predicate = predicate;
    }

    public process(): TSource {
        for (const element of this.source) {
            if (this.predicate(element)) {
                return element;
            }
        }

        throw new InvalidOperationError("Sequence contains no matching element");
    }
}