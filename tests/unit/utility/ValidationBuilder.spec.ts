import { describe, expect, it } from "vitest";
import { ValidationBuilder } from "../../../src/utility/ValidationBuilder";
import { ValidationError } from "../../../src/core/errors/argument/ValidationError";
import { ArgumentError } from "../../../src/core/errors/argument/ArgumentError";

describe("ValidationBuilder", () => {
    describe("check()", () => {
        it("returns this for chaining when no error is thrown", () => {
            const builder = new ValidationBuilder();
            const result = builder.check(() => { /* no error */ });
            expect(result).toBe(builder);
        });

        it("returns this for chaining when an error is thrown", () => {
            const builder = new ValidationBuilder();
            const result = builder.check(() => { throw new Error("fail"); });
            expect(result).toBe(builder);
        });

        it("collects the error message when the callback throws an Error", () => {
            const builder = new ValidationBuilder();
            builder.check(() => { throw new Error("bad value"); });
            expect(() => builder.throwIfAny()).toThrow(ValidationError);
        });

        it("collects a non-Error thrown value as a string", () => {
            const builder = new ValidationBuilder();
            builder.check(() => { throw "raw string error"; });
            expect(() => builder.throwIfAny()).toThrow(ValidationError);
        });

        it("does not collect anything when callback succeeds", () => {
            const builder = new ValidationBuilder();
            builder.check(() => { /* ok */ });
            expect(() => builder.throwIfAny()).not.toThrow();
        });
    });

    describe("throwIfAny()", () => {
        it("does not throw when no checks failed", () => {
            expect(() =>
                new ValidationBuilder()
                    .check(() => { /* ok */ })
                    .throwIfAny()
            ).not.toThrow();
        });

        it("throws ValidationError when one check failed", () => {
            expect(() =>
                new ValidationBuilder()
                    .check(() => { throw new ArgumentError("bad", "x"); })
                    .throwIfAny()
            ).toThrow(ValidationError);
        });

        it("throws ValidationError when multiple checks failed", () => {
            expect(() =>
                new ValidationBuilder()
                    .check(() => { throw new Error("first"); })
                    .check(() => { throw new Error("second"); })
                    .throwIfAny()
            ).toThrow(ValidationError);
        });

        it("the thrown ValidationError contains all collected messages", () => {
            let caught: ValidationError | undefined;
            try {
                new ValidationBuilder()
                    .check(() => { throw new Error("err1"); })
                    .check(() => { /* ok */ })
                    .check(() => { throw new Error("err2"); })
                    .throwIfAny();
            } catch (e) {
                caught = e as ValidationError;
            }

            expect(caught).toBeInstanceOf(ValidationError);
            expect(caught!.errors).toHaveLength(2);
            expect(caught!.errors[0]).toBe("err1");
            expect(caught!.errors[1]).toBe("err2");
        });

        it("the thrown ValidationError message lists the errors", () => {
            let caught: ValidationError | undefined;
            try {
                new ValidationBuilder()
                    .check(() => { throw new Error("problem one"); })
                    .check(() => { throw new Error("problem two"); })
                    .throwIfAny();
            } catch (e) {
                caught = e as ValidationError;
            }

            expect(caught!.message).toContain("2 validation error(s)");
            expect(caught!.message).toContain("problem one");
            expect(caught!.message).toContain("problem two");
        });

        it("does not throw on empty builder (no checks)", () => {
            expect(() => new ValidationBuilder().throwIfAny()).not.toThrow();
        });
    });
});
