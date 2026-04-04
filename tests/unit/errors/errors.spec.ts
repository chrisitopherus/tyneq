import { describe, expect, it } from "vitest";
import { TyneqError } from "../../../src/core/errors/TyneqError";
import { CompilerError } from "../../../src/core/errors/CompilerError";
import { PluginError } from "../../../src/core/errors/PluginError";
import { ReflectionError } from "../../../src/core/errors/ReflectionError";
import { RegistryError } from "../../../src/core/errors/RegistryError";
import { KeyNotFoundError } from "../../../src/core/errors/KeyNotFoundError";
import { NotSupportedError } from "../../../src/core/errors/NotSupportedError";

describe("TyneqError", () => {
    it("is an instance of Error", () => {
        const err = new TyneqError("test");
        expect(err).toBeInstanceOf(Error);
    });

    it("sets message", () => {
        expect(new TyneqError("hello").message).toBe("hello");
    });

    it("sets name to the class name", () => {
        expect(new TyneqError("x").name).toBe("TyneqError");
    });

    it("inner is undefined when not provided", () => {
        expect(new TyneqError("x").inner).toBeUndefined();
    });

    it("stores inner error when provided", () => {
        const inner = new Error("inner");
        const err = new TyneqError("outer", { inner });
        expect(err.inner).toBe(inner);
    });

    it("instanceof works correctly across prototype chain", () => {
        const err = new TyneqError("x");
        expect(err instanceof TyneqError).toBe(true);
    });
});

describe("CompilerError", () => {
    it("is an instance of TyneqError", () => {
        expect(new CompilerError("msg", "source")).toBeInstanceOf(TyneqError);
    });

    it("sets message", () => {
        expect(new CompilerError("msg", "operator").message).toBe("msg");
    });

    it("sets phase", () => {
        expect(new CompilerError("msg", "transform").phase).toBe("transform");
        expect(new CompilerError("msg", "source").phase).toBe("source");
        expect(new CompilerError("msg", "operator").phase).toBe("operator");
    });

    it("operatorName is undefined when not provided", () => {
        expect(new CompilerError("msg", "source").operatorName).toBeUndefined();
    });

    it("stores operatorName when provided", () => {
        expect(new CompilerError("msg", "operator", "where").operatorName).toBe("where");
    });

    it("inner is undefined when not provided", () => {
        expect(new CompilerError("msg", "source").inner).toBeUndefined();
    });

    it("stores inner error when provided", () => {
        const inner = new Error("inner");
        const err = new CompilerError("msg", "transform", undefined, inner);
        expect(err.inner).toBe(inner);
    });

    it("name is CompilerError", () => {
        expect(new CompilerError("msg", "source").name).toBe("CompilerError");
    });
});

describe("PluginError", () => {
    it("is an instance of TyneqError", () => {
        expect(new PluginError("msg", "operator")).toBeInstanceOf(TyneqError);
    });

    it("sets message", () => {
        expect(new PluginError("msg", "operator").message).toBe("msg");
    });

    it("sets decoratorName", () => {
        expect(new PluginError("msg", "terminal").decoratorName).toBe("terminal");
    });

    it("targetName is undefined when not provided", () => {
        expect(new PluginError("msg", "operator").targetName).toBeUndefined();
    });

    it("stores targetName when provided", () => {
        expect(new PluginError("msg", "operator", "MyOp").targetName).toBe("MyOp");
    });

    it("stores inner error when provided", () => {
        const inner = new Error("inner");
        const err = new PluginError("msg", "operator", undefined, inner);
        expect(err.inner).toBe(inner);
    });

    it("name is PluginError", () => {
        expect(new PluginError("msg", "operator").name).toBe("PluginError");
    });
});

describe("ReflectionError", () => {
    it("is an instance of TyneqError", () => {
        expect(new ReflectionError("msg", "myMethod")).toBeInstanceOf(TyneqError);
    });

    it("sets message", () => {
        expect(new ReflectionError("msg", "process").message).toBe("msg");
    });

    it("sets methodName", () => {
        expect(new ReflectionError("msg", "next").methodName).toBe("next");
    });

    it("prototypeName is undefined when not provided", () => {
        expect(new ReflectionError("msg", "next").prototypeName).toBeUndefined();
    });

    it("stores prototypeName when provided", () => {
        expect(new ReflectionError("msg", "next", "MyClass").prototypeName).toBe("MyClass");
    });

    it("stores inner error when provided", () => {
        const inner = new Error("inner");
        const err = new ReflectionError("msg", "next", undefined, inner);
        expect(err.inner).toBe(inner);
    });

    it("name is ReflectionError", () => {
        expect(new ReflectionError("msg", "next").name).toBe("ReflectionError");
    });
});

describe("RegistryError", () => {
    it("is an instance of TyneqError", () => {
        expect(new RegistryError("msg", "myOp")).toBeInstanceOf(TyneqError);
    });

    it("sets message", () => {
        expect(new RegistryError("msg", "where").message).toBe("msg");
    });

    it("sets operatorName", () => {
        expect(new RegistryError("msg", "select").operatorName).toBe("select");
    });

    it("kind is undefined when not provided", () => {
        expect(new RegistryError("msg", "where").kind).toBeUndefined();
    });

    it("stores kind when provided", () => {
        expect(new RegistryError("msg", "where", "streaming").kind).toBe("streaming");
    });

    it("conflictingKind is undefined when no conflict provided", () => {
        expect(new RegistryError("msg", "where").conflictingKind).toBeUndefined();
    });

    it("stores conflictingKind from conflict param", () => {
        const err = new RegistryError("msg", "where", "streaming", { kind: "buffer", source: "internal" });
        expect(err.conflictingKind).toBe("buffer");
    });

    it("stores conflictingSource from conflict param", () => {
        const err = new RegistryError("msg", "where", "streaming", { kind: "buffer", source: "external" });
        expect(err.conflictingSource).toBe("external");
    });

    it("stores inner error when provided", () => {
        const inner = new Error("inner");
        const err = new RegistryError("msg", "where", undefined, undefined, inner);
        expect(err.inner).toBe(inner);
    });

    it("name is RegistryError", () => {
        expect(new RegistryError("msg", "where").name).toBe("RegistryError");
    });
});

describe("KeyNotFoundError", () => {
    it("is an instance of TyneqError", () => {
        expect(new KeyNotFoundError()).toBeInstanceOf(TyneqError);
    });

    it("uses the default message when none provided", () => {
        expect(new KeyNotFoundError().message).toBe("The given key was not present in the dictionary.");
    });

    it("accepts a custom message", () => {
        expect(new KeyNotFoundError("custom").message).toBe("custom");
    });

    it("stores inner error when provided", () => {
        const inner = new Error("inner");
        expect(new KeyNotFoundError(undefined, inner).inner).toBe(inner);
    });

    it("name is KeyNotFoundError", () => {
        expect(new KeyNotFoundError().name).toBe("KeyNotFoundError");
    });
});

describe("NotSupportedError", () => {
    it("is an instance of TyneqError", () => {
        expect(new NotSupportedError()).toBeInstanceOf(TyneqError);
    });

    it("uses the default message when none provided", () => {
        expect(new NotSupportedError().message).toBe("The requested operation is not supported.");
    });

    it("accepts a custom message", () => {
        expect(new NotSupportedError("custom").message).toBe("custom");
    });

    it("stores inner error when provided", () => {
        const inner = new Error("inner");
        expect(new NotSupportedError(undefined, inner).inner).toBe(inner);
    });

    it("name is NotSupportedError", () => {
        expect(new NotSupportedError().name).toBe("NotSupportedError");
    });
});
