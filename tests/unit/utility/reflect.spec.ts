import { describe, expect, it } from "vitest";
import { reflect } from "../../../src/utility/reflect";
import { ReflectionError } from "../../../src/core/errors/ReflectionError";

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

class Animal {
    public kind = "animal";
    public get label(): string { return this.kind; }
    public set label(v: string) { this.kind = v; }
    public describe(): string { return `I am ${this.kind}`; }
}

class Dog extends Animal {
    public breed = "lab";
    public get name(): string { return "Dog"; }
    public bark(): void { /* noop */ }
}

const SYM = Symbol("test");

class WithSymbol {
    public [SYM](): void { /* noop */ }
    public plain(): void { /* noop */ }
}

// ---------------------------------------------------------------------------
// reflect() -- target resolution
// ---------------------------------------------------------------------------

describe("reflect()", () => {
    describe("target resolution", () => {
        it("accepts a constructor and reflects the prototype", () => {
            const ctx = reflect(Animal);
            expect(ctx.has("describe")).toBe(true);
        });

        it("accepts a prototype object directly", () => {
            const ctx = reflect(Animal.prototype);
            expect(ctx.has("describe")).toBe(true);
        });

        it("reflect(Constructor) and reflect(Constructor.prototype) produce identical member sets", () => {
            const summarize = (m: { kind: string; name: string | symbol }) => ({ kind: m.kind, name: m.name });
            expect(reflect(Animal).members().map(summarize)).toEqual(reflect(Animal.prototype).members().map(summarize));
        });

        it("accepts a plain object and reflects its own properties", () => {
            const obj = { run() { return 1; } };
            const ctx = reflect(obj);
            expect(ctx.has("run")).toBe(true);
        });
    });

    // -----------------------------------------------------------------------
    // members()
    // -----------------------------------------------------------------------

    describe("members()", () => {
        it("returns method, accessor, and data descriptors", () => {
            const ctx = reflect(Animal);
            const kinds = ctx.members().map((m) => m.kind);
            expect(kinds).toContain("method");
            expect(kinds).toContain("accessor");
        });

        it("excludes constructor", () => {
            const ctx = reflect(Animal);
            const names = ctx.members().map((m) => String(m.name));
            expect(names).not.toContain("constructor");
        });

        it("does not include inherited members by default", () => {
            const ctx = reflect(Dog);
            const names = ctx.members().map((m) => String(m.name));
            expect(names).toContain("bark");
            expect(names).toContain("name"); // Dog's own getter
            expect(names).not.toContain("describe"); // Animal's method -- not own
        });

        it("includes inherited members when inherited:true", () => {
            const ctx = reflect(Dog, { inherited: true });
            const names = ctx.members().map((m) => String(m.name));
            expect(names).toContain("bark");
            expect(names).toContain("describe");
            expect(names).toContain("label");
        });

        it("does not include Symbol keys by default", () => {
            const ctx = reflect(WithSymbol);
            const names = ctx.members().map((m) => m.name);
            expect(names).not.toContain(SYM);
        });

        it("includes Symbol keys when symbols:true", () => {
            const ctx = reflect(WithSymbol, { symbols: true });
            const names = ctx.members().map((m) => m.name);
            expect(names).toContain(SYM);
        });

        it("deduplicates inherited members -- own member wins over ancestor", () => {
            class Base { public run(): void { /* base */ } }
            class Child extends Base { public override run(): void { /* child */ } }
            const ctx = reflect(Child, { inherited: true });
            const runDescriptors = ctx.members().filter((m) => m.name === "run");
            expect(runDescriptors).toHaveLength(1);
        });

        it("inherited:true does not include Object.prototype members", () => {
            const names = reflect(Dog, { inherited: true }).members().map((m) => String(m.name));
            expect(names).not.toContain("toString");
            expect(names).not.toContain("hasOwnProperty");
        });

        it("inherited:true and symbols:true compose correctly", () => {
            const ctx = reflect(WithSymbol, { inherited: true, symbols: true });
            const names = ctx.members().map((m) => m.name);
            expect(names).toContain(SYM);
            expect(names).toContain("plain");
            expect(names).not.toContain("toString");
        });
    });

    // -----------------------------------------------------------------------
    // methods()
    // -----------------------------------------------------------------------

    describe("methods()", () => {
        it("returns only method descriptors", () => {
            const ctx = reflect(Animal);
            const methods = ctx.methods();
            expect(methods.every((m) => m.kind === "method")).toBe(true);
        });

        it("does not include accessors", () => {
            const ctx = reflect(Animal);
            const names = ctx.methods().map((m) => String(m.name));
            expect(names).not.toContain("label");
        });
    });

    // -----------------------------------------------------------------------
    // fields()
    // -----------------------------------------------------------------------

    describe("fields()", () => {
        class WithProtoField {}
        Object.defineProperty(WithProtoField.prototype, "protoVal", {
            value: 42, writable: true, configurable: true, enumerable: true
        });

        it("returns only data descriptors", () => {
            const ctx = reflect(WithProtoField);
            const fields = ctx.fields();
            expect(fields.length).toBeGreaterThan(0);
            expect(fields.every((f) => f.kind === "data")).toBe(true);
        });

        it("includes a prototype-level data property with correct value", () => {
            const field = reflect(WithProtoField).fields().find((f) => f.name === "protoVal");
            expect(field?.value).toBe(42);
        });

        it("returns empty for a prototype with only methods and accessors", () => {
            const ctx = reflect(Animal);
            expect(ctx.fields()).toHaveLength(0);
        });
    });

    // -----------------------------------------------------------------------
    // accessors()
    // -----------------------------------------------------------------------

    describe("accessors()", () => {
        it("returns only accessor descriptors", () => {
            const ctx = reflect(Animal);
            const accessors = ctx.accessors();
            expect(accessors.every((a) => a.kind === "accessor")).toBe(true);
        });

        it("correctly identifies canRead and canWrite", () => {
            const ctx = reflect(Animal);
            const label = ctx.accessors().find((a) => a.name === "label");
            expect(label?.canRead).toBe(true);
            expect(label?.canWrite).toBe(true);
        });

        it("readonly accessor has canWrite false", () => {
            class ReadOnly {
                public get value(): number { return 1; }
            }
            const ctx = reflect(ReadOnly);
            const v = ctx.accessors().find((a) => a.name === "value");
            expect(v?.canRead).toBe(true);
            expect(v?.canWrite).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    // has() / get()
    // -----------------------------------------------------------------------

    describe("has()", () => {
        it("returns true for an existing member", () => {
            expect(reflect(Animal).has("describe")).toBe(true);
        });

        it("returns false for a non-existent member", () => {
            expect(reflect(Animal).has("missing")).toBe(false);
        });

        it("returns false for an inherited member when inherited:false", () => {
            expect(reflect(Dog).has("describe")).toBe(false);
        });

        it("returns true for an inherited member when inherited:true", () => {
            expect(reflect(Dog, { inherited: true }).has("describe")).toBe(true);
        });
    });

    // -----------------------------------------------------------------------
    // hasMethod()
    // -----------------------------------------------------------------------

    describe("hasMethod()", () => {
        it("returns true for an existing method", () => {
            expect(reflect(Animal).hasMethod("describe")).toBe(true);
        });

        it("returns false for a name not on the target", () => {
            expect(reflect(Animal).hasMethod("missing")).toBe(false);
        });

        it("returns false when the member is an accessor, not a method", () => {
            expect(reflect(Animal).hasMethod("label")).toBe(false);
        });
    });

    describe("get()", () => {
        it("returns the descriptor for an existing member", () => {
            const d = reflect(Animal).get("describe");
            expect(d?.kind).toBe("method");
            expect(d?.name).toBe("describe");
        });

        it("returns undefined for a missing member", () => {
            expect(reflect(Animal).get("missing")).toBeUndefined();
        });
    });

    // -----------------------------------------------------------------------
    // getMethod()
    // -----------------------------------------------------------------------

    describe("getMethod()", () => {
        it("returns a MethodDescriptor for a method", () => {
            const m = reflect(Animal).getMethod("describe");
            expect(m.kind).toBe("method");
            expect(typeof m.value).toBe("function");
        });

        it("invoke() calls the method with the correct this", () => {
            const m = reflect(Animal).getMethod("describe");
            const instance = new Animal();
            instance.kind = "cat";
            expect(m.invoke(instance)).toBe("I am cat");
        });

        it("throws ReflectionError when method is absent", () => {
            expect(() => reflect(Animal).getMethod("missing")).toThrow(ReflectionError);
        });

        it("throws ReflectionError when the name refers to an accessor, not a method", () => {
            expect(() => reflect(Animal).getMethod("label")).toThrow(ReflectionError);
        });
    });

    // -----------------------------------------------------------------------
    // getAccessor()
    // -----------------------------------------------------------------------

    describe("getAccessor()", () => {
        it("returns an AccessorDescriptor for an accessor", () => {
            const a = reflect(Animal).getAccessor("label");
            expect(a.kind).toBe("accessor");
            expect(a.canRead).toBe(true);
        });

        it("throws ReflectionError when accessor is absent", () => {
            expect(() => reflect(Animal).getAccessor("missing")).toThrow(ReflectionError);
        });

        it("throws ReflectionError when the name refers to a method, not an accessor", () => {
            expect(() => reflect(Animal).getAccessor("describe")).toThrow(ReflectionError);
        });
    });

    // -----------------------------------------------------------------------
    // MethodDescriptor.invoke()
    // -----------------------------------------------------------------------

    describe("MethodDescriptor.invoke()", () => {
        it("passes arguments correctly", () => {
            class Calc {
                public add(a: number, b: number): number { return a + b; }
            }
            const m = reflect(Calc).getMethod("add");
            expect(m.invoke(new Calc(), 3, 4)).toBe(7);
        });
    });
});
