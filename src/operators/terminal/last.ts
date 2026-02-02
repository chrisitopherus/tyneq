import { InvalidOperationError } from "../../core/errors/InvalidOperationError";
import { TyneqTerminalOperator } from "../../core/operator/TyneqTerminalOperator";
import { ITyneqEnumerable } from "../../types/core";
import { Nullable } from "../../types/utility";
import { ArgumentUtility } from "../../utility/argumentUtility";
import { nameof } from "../../utility/nameof";

export class LastOperator<TSource> extends TyneqTerminalOperator<TSource, TSource> {
    private readonly predicate: (item: TSource) => boolean;

    public constructor(source: ITyneqEnumerable<TSource>, predicate: (item: TSource) => boolean) {
        super(source);
        ArgumentUtility.checkNotOptional(predicate, nameof({ predicate }));

        this.predicate = predicate;
    }

    public process(): TSource {
        let lastMatchingElement: Nullable<TSource> = null;
        let found = false;

        for (const element of this.source) {
            if (this.predicate(element)) {
                lastMatchingElement = element;
                found = true;
            }
        }
        
        if (!found) {
            throw new InvalidOperationError("Sequence contains no matching element");
        }

        return lastMatchingElement as TSource;
    }
}