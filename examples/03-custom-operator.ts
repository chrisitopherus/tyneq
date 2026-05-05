/**
 * Custom operator example.
 *
 * Shows how a consumer of the library adds a terminal operator using the
 * functional API and TypeScript module augmentation.
 * Run with: npx tsx examples/03-custom-operator.ts
 */
import { Tyneq, createTerminalOperator, createGeneratorOperator } from "../src/index";

// ---- Custom terminal: joinString ---------------------------------------------
createTerminalOperator({
    name: "joinString",
    execute(source, separator: string): string {
        const parts: string[] = [];
        for (const item of source) parts.push(String(item));
        return parts.join(separator);
    },
    validate(separator: unknown) {
        if (typeof separator !== "string") throw new TypeError("separator must be a string");
    },
});

declare module "../src/index" {
    interface TyneqSequence<TSource> {
        joinString(separator: string): string;
    }
}

const joined = Tyneq.from([1, 2, 3, 4, 5]).joinString(", ");
console.log("joinString:", joined);
// "1, 2, 3, 4, 5"

// ---- Custom streaming operator: interleave ----------------------------------
// Yields elements from source and other alternately.
createGeneratorOperator({
    name: "interleave",
    *generate(source: Iterable<unknown>, other: Iterable<unknown>) {
        const itA = source[Symbol.iterator]();
        const itB = other[Symbol.iterator]();
        while (true) {
            const a = itA.next();
            const b = itB.next();
            if (a.done && b.done) break;
            if (!a.done) yield a.value;
            if (!b.done) yield b.value;
        }
    },
});

declare module "../src/index" {
    interface TyneqSequence<TSource> {
        interleave(other: Iterable<TSource>): TyneqSequence<TSource>;
    }
}

const interleaved = Tyneq.from([1, 3, 5]).interleave([2, 4, 6]).toArray();
console.log("interleave:", interleaved);
// [1, 2, 3, 4, 5, 6]
