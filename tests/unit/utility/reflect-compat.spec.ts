/**
 * Covers the reflect() API for the cases previously tested by ReflectionUtility:
 * getMethod / tryGetMethod / hasMethod / has / methods() / fields() / accessors() / members()
 */
import { describe, expect, it } from "vitest";
import { reflect } from "../../../src/utility/reflect";
import { ReflectionError } from "../../../src/core/errors/ReflectionError";

class Sample {
    public value: number = 42;
    public name: string = "hello";
    public greet(): string { return "hi"; }
    public add(a: number, b: number): number { return a + b; }
}

const proto = Sample.prototype;

describe("reflect() -- compat surface", () => {
    describe("getMethod()", () => {
        it("returns a MethodDescriptor with a callable value", () => {
            const m = reflect(proto).getMethod("greet");
            expect(typeof m.value).toBe("function");
        });

        it("throws ReflectionError when method is absent", () => {
            expect(() => reflect(proto).getMethod("missing")).toThrow(ReflectionError);
        });

        it("thrown error carries methodName and prototypeName", () => {
            let caught: ReflectionError | undefined;
            try {
                reflect(proto).getMethod("missing");
            } catch (e) {
                caught = e as ReflectionError;
            }

            expect(caught?.methodName).toBe("missing");
            expect(caught?.prototypeName).toBe("Sample");
        });
    });

    describe("tryGetMethod()", () => {
        it("returns a MethodDescriptor when the method exists", () => {
            const m = reflect(proto).tryGetMethod("greet");
            expect(typeof m?.value).toBe("function");
        });

        it("returns undefined when method is absent", () => {
            expect(reflect(proto).tryGetMethod("missing")).toBeUndefined();
        });

        it("returns undefined for a non-function property name", () => {
            expect(reflect(proto).tryGetMethod("value")).toBeUndefined();
        });
    });

    describe("hasMethod()", () => {
        it("returns true for an existing method", () => {
            expect(reflect(proto).hasMethod("greet")).toBe(true);
        });

        it("returns false for a name not on the prototype", () => {
            expect(reflect(proto).hasMethod("missing")).toBe(false);
        });

        it("returns false for an accessor (not a method)", () => {
            class WithGetter {
                public get computed(): number { return 1; }
            }
            expect(reflect(WithGetter.prototype).hasMethod("computed")).toBe(false);
        });
    });

    describe("has()", () => {
        it("returns true for an existing member", () => {
            expect(reflect(proto).has("greet")).toBe(true);
        });

        it("returns false for a name not on the prototype", () => {
            expect(reflect(proto).has("missing")).toBe(false);
        });
    });

    describe("methods()", () => {
        it("returns method names present on the prototype", () => {
            const names = reflect(proto).methods().map((m) => m.name);
            expect(names).toContain("greet");
            expect(names).toContain("add");
        });

        it("does not include constructor", () => {
            expect(reflect(proto).methods().map((m) => m.name)).not.toContain("constructor");
        });

        it("does not include instance data fields (not on prototype)", () => {
            const names = reflect(proto).methods().map((m) => m.name);
            expect(names).not.toContain("value");
            expect(names).not.toContain("name");
        });
    });

    describe("fields()", () => {
        class WithField {
            public label = "x";
            public show(): void { /* method */ }
        }

        it("returns no descriptors for a prototype with only methods", () => {
            expect(reflect(WithField.prototype).fields()).toHaveLength(0);
        });

        it("does not include method names", () => {
            const names = reflect(WithField.prototype).fields().map((f) => f.name);
            expect(names).not.toContain("show");
        });
    });

    describe("members()", () => {
        it("includes all method names", () => {
            const names = reflect(proto).members().map((m) => m.name);
            expect(names).toContain("greet");
            expect(names).toContain("add");
        });

        it("does not include constructor", () => {
            expect(reflect(proto).members().map((m) => m.name)).not.toContain("constructor");
        });
    });

    describe("accessors()", () => {
        class WithAccessor {
            public get computed(): number { return 1; }
            public run(): void { /* method */ }
        }

        it("does not include method names", () => {
            const accessorNames = reflect(WithAccessor.prototype).accessors().map((a) => a.name);
            expect(accessorNames).not.toContain("run");
        });

        it("returns an empty list when there are only methods", () => {
            expect(reflect(proto).accessors()).toHaveLength(0);
        });

        it("getter-only accessor is not present in methods()", () => {
            const methodNames = reflect(WithAccessor.prototype).methods().map((m) => m.name);
            expect(methodNames).not.toContain("computed");
        });
    });

    describe("getMethod().value callable", () => {
        it("method value is callable and behaves correctly", () => {
            const greet = reflect(proto).getMethod("greet").value;
            const add = reflect(proto).getMethod("add").value;
            const instance = new Sample();
            expect(greet.call(instance)).toBe("hi");
            expect(add.call(instance, 3, 4)).toBe(7);
        });
    });
});
