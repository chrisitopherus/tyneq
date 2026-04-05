import { afterEach, describe, expect, it, vi } from "vitest";
// Import from the main entry point to trigger operator barrel registration as a side-effect.
import "../../../src";
import { OperatorRegistry } from "../../../src/core/registry/TyneqOperatorRegistry";
import { OperatorMetadata } from "../../../src/core/OperatorMetadata";
import { TyneqEnumerableBase } from "../../../src/core/TyneqEnumerableBase";

// Each test that registers an operator must use a unique name because registrations
// permanently patch TyneqEnumerableBase.prototype for the lifetime of the process.
// Tests that register operators clean up after themselves using unregister() in afterEach.
const UID = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
let counter = 0;
const nextName = (tag: string): string => `__regSpec_${tag}_${UID}_${counter++}`;

const noop = () => {};
const noopImpl = function () { return null; };

// register()

describe("OperatorRegistry.register", () => {
  const registered: string[] = [];

  afterEach(() => {
    for (const name of registered.splice(0)) {
      OperatorRegistry.unregister(name);
    }
  });

  it("adds the operator to the registry", () => {
    const name = nextName("reg");
    registered.push(name);

    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });

    expect(OperatorRegistry.has(name)).toBe(true);
  });

  it("patches TyneqEnumerableBase.prototype with the impl", () => {
    const name = nextName("proto");
    registered.push(name);
    const impl = vi.fn(function () { return 42; });

    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl });

    expect(typeof (TyneqEnumerableBase.prototype as any)[name]).toBe("function");
  });

  it("defaults source to 'external' when not passed to constructor", () => {
    const name = nextName("src");
    registered.push(name);

    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "terminal"), impl: noopImpl });

    expect(OperatorRegistry.getMetadata(name)?.source).toBe("external");
  });

  it("preserves explicitly provided source", () => {
    const name = nextName("srcInternal");
    registered.push(name);

    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming", "internal"), impl: noopImpl });

    expect(OperatorRegistry.getMetadata(name)?.source).toBe("internal");
  });

  it("throws when registering a duplicate name", () => {
    const name = nextName("dup");
    registered.push(name);

    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });

    expect(() =>
      OperatorRegistry.register({ metadata: new OperatorMetadata(name, "buffer"), impl: noopImpl })
    ).toThrow(Error);
  });

  it("duplicate error message contains the conflicting name", () => {
    const name = nextName("dupMsg");
    registered.push(name);

    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });

    expect(() =>
      OperatorRegistry.register({ metadata: new OperatorMetadata(name, "terminal"), impl: noopImpl })
    ).toThrow(name);
  });
});

// unregister()

describe("OperatorRegistry.unregister", () => {
  it("returns true when the operator existed and was removed", () => {
    const name = nextName("unreg");
    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });

    expect(OperatorRegistry.unregister(name)).toBe(true);
  });

  it("returns false when the operator was not registered", () => {
    expect(OperatorRegistry.unregister("__nonexistent_xyz_abc__")).toBe(false);
  });

  it("removes the operator from the registry after unregister", () => {
    const name = nextName("unregRemove");
    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });
    OperatorRegistry.unregister(name);

    expect(OperatorRegistry.has(name)).toBe(false);
  });

  it("removes the method from TyneqEnumerableBase.prototype after unregister", () => {
    const name = nextName("unregProto");
    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });
    OperatorRegistry.unregister(name);

    expect((TyneqEnumerableBase.prototype as any)[name]).toBeUndefined();
  });
});

// onRegister() — post-registration hook

describe("OperatorRegistry.onRegister", () => {
  const registered: string[] = [];
  const hooks: Array<() => void> = [];

  afterEach(() => {
    for (const unsub of hooks.splice(0)) unsub();
    for (const name of registered.splice(0)) OperatorRegistry.unregister(name);
  });

  it("fires the hook after each successful registration", () => {
    const hook = vi.fn();
    hooks.push(OperatorRegistry.onRegister(hook));

    const name = nextName("hook");
    registered.push(name);
    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });

    expect(hook).toHaveBeenCalledTimes(1);
  });

  it("passes the full OperatorEntry to the hook", () => {
    let received: any;
    hooks.push(OperatorRegistry.onRegister((entry) => { received = entry; }));

    const name = nextName("hookEntry");
    registered.push(name);
    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "buffer"), impl: noopImpl });

    expect(received?.metadata?.name).toBe(name);
    expect(received?.metadata?.kind).toBe("buffer");
  });

  it("fires hooks in insertion order", () => {
    const order: number[] = [];
    hooks.push(OperatorRegistry.onRegister(() => order.push(1)));
    hooks.push(OperatorRegistry.onRegister(() => order.push(2)));
    hooks.push(OperatorRegistry.onRegister(() => order.push(3)));

    const name = nextName("hookOrder");
    registered.push(name);
    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });

    expect(order).toEqual([1, 2, 3]);
  });

  it("does not fire after the returned unsubscribe function is called", () => {
    const hook = vi.fn();
    const unsub = OperatorRegistry.onRegister(hook);
    unsub();

    const name = nextName("hookUnsub");
    registered.push(name);
    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });

    expect(hook).not.toHaveBeenCalled();
  });

  it("calling unsubscribe a second time is a no-op", () => {
    const hook = vi.fn();
    const unsub = OperatorRegistry.onRegister(hook);
    unsub();

    expect(() => unsub()).not.toThrow();
  });
});

// addGuard() — pre-registration guard

describe("OperatorRegistry.addGuard", () => {
  const guards: Array<() => void> = [];

  afterEach(() => {
    for (const remove of guards.splice(0)) remove();
  });

  it("allows registration when the guard does not throw", () => {
    const name = nextName("guardAllow");
    guards.push(OperatorRegistry.addGuard(noop));

    expect(() =>
      OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl })
    ).not.toThrow();

    OperatorRegistry.unregister(name);
  });

  it("blocks registration when the guard throws", () => {
    const name = nextName("guardBlock");
    guards.push(OperatorRegistry.addGuard(() => { throw new Error("blocked by guard"); }));

    expect(() =>
      OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl })
    ).toThrow("blocked by guard");
  });

  it("leaves the registry clean when a guard blocks registration", () => {
    const name = nextName("guardClean");
    guards.push(OperatorRegistry.addGuard(() => { throw new Error("blocked"); }));

    try {
      OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });
    } catch { /* expected */ }

    expect(OperatorRegistry.has(name)).toBe(false);
    expect((TyneqEnumerableBase.prototype as any)[name]).toBeUndefined();
  });

  it("does not fire guard after the returned unsubscribe function is called", () => {
    const guard = vi.fn();
    const removeGuard = OperatorRegistry.addGuard(guard);
    removeGuard();

    const name = nextName("guardUnsub");
    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });
    OperatorRegistry.unregister(name);

    expect(guard).not.toHaveBeenCalled();
  });

  it("guards fire in insertion order and the first throw stops subsequent guards", () => {
    const order: number[] = [];
    guards.push(OperatorRegistry.addGuard(() => { order.push(1); throw new Error("stop"); }));
    guards.push(OperatorRegistry.addGuard(() => order.push(2)));

    const name = nextName("guardOrder");
    try {
      OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });
    } catch { /* expected */ }

    expect(order).toEqual([1]);
  });
});

// Introspection: has(), get(), list(), listByKind(), listBySource(), count()

describe("OperatorRegistry introspection", () => {
  it("has() returns false for an unregistered name", () => {
    expect(OperatorRegistry.has("__does_not_exist__")).toBe(false);
  });

  it("get() returns undefined for an unregistered name", () => {
    expect(OperatorRegistry.getMetadata("__does_not_exist__")).toBeUndefined();
  });

  it("list() includes all registered operator metadata", () => {
    // Real operators registered by the library are present
    const names = OperatorRegistry.list().map((m) => m.name);
    expect(names).toContain("where");
    expect(names).toContain("select");
    expect(names).toContain("toArray");
  });

  it("listByKind('streaming') returns only streaming operators", () => {
    const kinds = OperatorRegistry.listByKind("streaming").map((m) => m.kind);
    expect(kinds.every((k) => k === "streaming")).toBe(true);
    expect(kinds.length).toBeGreaterThan(0);
  });

  it("listByKind('terminal') returns only terminal operators", () => {
    const kinds = OperatorRegistry.listByKind("terminal").map((m) => m.kind);
    expect(kinds.every((k) => k === "terminal")).toBe(true);
    expect(kinds.length).toBeGreaterThan(0);
  });

  it("listByKind('buffer') returns only buffer operators", () => {
    const kinds = OperatorRegistry.listByKind("buffer").map((m) => m.kind);
    expect(kinds.every((k) => k === "buffer")).toBe(true);
    expect(kinds.length).toBeGreaterThan(0);
  });

  it("listBySource('internal') returns only built-in operators", () => {
    const sources = OperatorRegistry.listBySource("internal").map((m) => m.source);
    expect(sources.every((s) => s === "internal")).toBe(true);
    expect(sources.length).toBeGreaterThan(0);
  });

  it("listBySource('external') returns only third-party operators", () => {
    const name = nextName("extOp");
    OperatorRegistry.register({ metadata: OperatorMetadata.streaming(name), impl: noopImpl });

    const sources = OperatorRegistry.listBySource("external").map((m) => m.source);
    expect(sources.every((s) => s === "external")).toBe(true);
    expect(sources.length).toBeGreaterThan(0);

    OperatorRegistry.unregister(name);
  });

  it("OperatorMetadata.streaming factory defaults source to 'external'", () => {
    const meta = OperatorMetadata.streaming("test");
    expect(meta.source).toBe("external");
    expect(meta.kind).toBe("streaming");
  });

  it("OperatorMetadata.buffer factory defaults source to 'external'", () => {
    const meta = OperatorMetadata.buffer("test");
    expect(meta.source).toBe("external");
    expect(meta.kind).toBe("buffer");
  });

  it("OperatorMetadata.terminal factory defaults source to 'external'", () => {
    const meta = OperatorMetadata.terminal("test");
    expect(meta.source).toBe("external");
    expect(meta.kind).toBe("terminal");
  });

  it("OperatorMetadata preserves extensions bag", () => {
    const meta = OperatorMetadata.streaming("test", undefined, undefined, { version: "1.0", deprecated: false });
    expect(meta.extensions["version"]).toBe("1.0");
    expect(meta.extensions["deprecated"]).toBe(false);
  });

  it("'reverse' is registered with kind:'buffer'", () => {
    const meta = OperatorRegistry.getMetadata("reverse");
    expect(meta?.kind).toBe("buffer");
    expect(meta?.source).toBe("internal");
  });

  it("count() equals list().length", () => {
    expect(OperatorRegistry.count()).toBe(OperatorRegistry.list().length);
  });

  it("count() decreases by 1 after unregister", () => {
    const name = nextName("countUnreg");
    OperatorRegistry.register({ metadata: new OperatorMetadata(name, "streaming"), impl: noopImpl });
    const before = OperatorRegistry.count();
    OperatorRegistry.unregister(name);
    expect(OperatorRegistry.count()).toBe(before - 1);
  });

  it("get() returns the correct metadata for a known operator", () => {
    const meta = OperatorRegistry.getMetadata("where");
    expect(meta?.name).toBe("where");
    expect(meta?.kind).toBe("streaming");
    expect(meta?.source).toBe("internal");
  });

  it("listByKind('source') returns the four built-in source operators", () => {
    const names = OperatorRegistry.listByKind("source").map((m) => m.name);
    expect(names).toContain("from");
    expect(names).toContain("range");
    expect(names).toContain("random");
    expect(names).toContain("empty");
  });
});

// registerSource()

describe("OperatorRegistry.registerSource", () => {
  const registered: string[] = [];

  afterEach(() => {
    for (const name of registered.splice(0)) {
      OperatorRegistry.unregister(name);
    }
  });

  it("registers an entry with kind 'source'", () => {
    const name = nextName("srcKind");
    registered.push(name);
    OperatorRegistry.registerSource(name, () => null);

    expect(OperatorRegistry.getMetadata(name)?.kind).toBe("source");
  });

  it("defaults source to 'external'", () => {
    const name = nextName("srcDefault");
    registered.push(name);
    OperatorRegistry.registerSource(name, () => null);

    expect(OperatorRegistry.getMetadata(name)?.source).toBe("external");
  });

  it("preserves explicitly provided source 'internal'", () => {
    const name = nextName("srcInternal");
    registered.push(name);
    OperatorRegistry.registerSource(name, () => null, "internal");

    expect(OperatorRegistry.getMetadata(name)?.source).toBe("internal");
  });

  it("throws when registering a duplicate name", () => {
    const name = nextName("srcDup");
    registered.push(name);
    OperatorRegistry.registerSource(name, () => null);

    expect(() => OperatorRegistry.registerSource(name, () => null)).toThrow(Error);
  });

  it("impl delegates to the factory with the supplied args", () => {
    const name = nextName("srcImpl");
    registered.push(name);
    const results: unknown[] = [];
    OperatorRegistry.registerSource(name, (...args) => { results.push(...args); return null; });

    const entry = OperatorRegistry.get(name)!;
    entry.impl.call(null as never, "a", "b");

    expect(results).toEqual(["a", "b"]);
  });

  it("fires onRegister hooks after registration", () => {
    const hook = vi.fn();
    const unsub = OperatorRegistry.onRegister(hook);

    const name = nextName("srcHook");
    registered.push(name);
    OperatorRegistry.registerSource(name, () => null);
    unsub();

    expect(hook).toHaveBeenCalledTimes(1);
    expect(hook.mock.calls[0][0].metadata.name).toBe(name);
  });

  it("does not patch TyneqEnumerableBase.prototype", () => {
    const name = nextName("srcProto");
    registered.push(name);
    OperatorRegistry.registerSource(name, () => null);

    expect((TyneqEnumerableBase.prototype as any)[name]).toBeUndefined();
  });
});
