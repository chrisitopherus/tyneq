import { describe, expect, it } from "vitest";
import { ReflectionUtility } from "../../../src/utility/ReflectionUtility";
import { ReflectionError } from "../../../src/core/errors/ReflectionError";

// A concrete prototype used across tests
class Sample {
    public value: number = 42;
    public name: string = "hello";
    public greet(): string { return "hi"; }
    public add(a: number, b: number): number { return a + b; }
}

const proto = Sample.prototype;

describe("ReflectionUtility", () => {
    describe("getPrototypeMethod()", () => {
        it("returns the method when it exists", () => {
            const method = ReflectionUtility.getPrototypeMethod(proto, "greet");
            expect(typeof method).toBe("function");
        });

        it("throws ReflectionError when method is absent", () => {
            expect(() => ReflectionUtility.getPrototypeMethod(proto, "missing")).toThrow(ReflectionError);
        });

        it("thrown error carries methodName and prototypeName", () => {
            let caught: ReflectionError | undefined;
            try {
                ReflectionUtility.getPrototypeMethod(proto, "missing");
            } catch (e) {
                caught = e as ReflectionError;
            }

            expect(caught?.methodName).toBe("missing");
            expect(caught?.prototypeName).toBe("Sample");
        });
    });

    describe("tryGetPrototypeMethod()", () => {
        it("returns the method when it exists", () => {
            const method = ReflectionUtility.tryGetPrototypeMethod(proto, "greet");
            expect(typeof method).toBe("function");
        });

        it("returns undefined when method is absent", () => {
            expect(ReflectionUtility.tryGetPrototypeMethod(proto, "missing")).toBeUndefined();
        });

        it("returns undefined for a non-function property name", () => {
            // value/name are instance fields, not on prototype
            expect(ReflectionUtility.tryGetPrototypeMethod(proto, "value")).toBeUndefined();
        });
    });

    describe("hasMethod()", () => {
        it("returns true for an existing method", () => {
            expect(ReflectionUtility.hasMethod(proto, "greet")).toBe(true);
        });

        it("returns false for a name not on the prototype", () => {
            expect(ReflectionUtility.hasMethod(proto, "missing")).toBe(false);
        });
    });

    describe("hasProperty()", () => {
        it("returns true for an existing method name", () => {
            expect(ReflectionUtility.hasProperty(proto, "greet")).toBe(true);
        });

        it("returns false for a name not on the prototype", () => {
            expect(ReflectionUtility.hasProperty(proto, "missing")).toBe(false);
        });
    });

    describe("getMethodNames()", () => {
        it("returns method names present on the prototype", () => {
            const names = ReflectionUtility.getMethodNames(proto);
            expect(names).toContain("greet");
            expect(names).toContain("add");
        });

        it("does not include constructor", () => {
            expect(ReflectionUtility.getMethodNames(proto)).not.toContain("constructor");
        });

        it("does not include instance data fields (not on prototype)", () => {
            // value and name are initialised in the constructor, not prototype own properties
            const names = ReflectionUtility.getMethodNames(proto);
            expect(names).not.toContain("value");
            expect(names).not.toContain("name");
        });
    });

    describe("getFieldNames()", () => {
        // On a class prototype, data fields defined in the constructor body are NOT own
        // properties of the prototype — they live on instances. So a plain class prototype
        // has no field-type own properties unless class fields are used with initializers.
        class WithField {
            public label = "x";   // instance field — NOT a prototype own property
            public show(): void { /* method */ }
        }

        it("returns no names for a prototype with only methods", () => {
            expect(ReflectionUtility.getFieldNames(WithField.prototype)).toHaveLength(0);
        });

        it("does not include method names", () => {
            const names = ReflectionUtility.getFieldNames(WithField.prototype);
            expect(names).not.toContain("show");
        });
    });

    describe("getPropertyNames()", () => {
        it("includes all method names", () => {
            const names = ReflectionUtility.getPropertyNames(proto);
            expect(names).toContain("greet");
            expect(names).toContain("add");
        });

        it("does not include constructor", () => {
            expect(ReflectionUtility.getPropertyNames(proto)).not.toContain("constructor");
        });
    });

    describe("getMethods()", () => {
        it("returns a record containing each method", () => {
            const methods = ReflectionUtility.getMethods(proto);
            expect(typeof methods.greet).toBe("function");
            expect(typeof methods.add).toBe("function");
        });

        it("does not include constructor in the result", () => {
            const methods = ReflectionUtility.getMethods(proto) as Record<string, unknown>;
            expect(Object.hasOwn(methods, "constructor")).toBe(false);
        });

        it("returned method is callable and behaves correctly", () => {
            const methods = ReflectionUtility.getMethods(proto);
            const instance = new Sample();
            expect(methods.greet.call(instance)).toBe("hi");
            expect((methods.add as (a: number, b: number) => number).call(instance, 3, 4)).toBe(7);
        });
    });

    describe("getFields()", () => {
        class WithAccessor {
            public get computed(): number { return 1; }
            public run(): void { /* method */ }
        }

        it("does not include accessor (get/set) properties", () => {
            // 'computed' is a getter (accessor), not a data property — should not appear
            const fields = ReflectionUtility.getFields(WithAccessor.prototype) as Record<string, unknown>;
            expect(Object.hasOwn(fields, "computed")).toBe(false);
        });

        it("returns an empty record when all own properties are methods or accessors", () => {
            const fields = ReflectionUtility.getFields(WithAccessor.prototype) as Record<string, unknown>;
            expect(Object.keys(fields)).toHaveLength(0);
        });

        it("does not include method names", () => {
            const fields = ReflectionUtility.getFields(proto) as Record<string, unknown>;
            expect(Object.hasOwn(fields, "greet")).toBe(false);
        });
    });
});
