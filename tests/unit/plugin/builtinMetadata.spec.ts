import { afterEach, describe, expect, it, vi } from "vitest";
import { TyneqEnumerableBase } from "../../../src/core/TyneqEnumerableBase";
import { OperatorRegistry } from "../../../src/plugin/OperatorRegistry";
import { builtinOperator } from "../../../src/plugin/builtinOperator";
import { builtinTerminal } from "../../../src/plugin/builtinTerminal";
import {
  getOperatorMetadata,
  IOperatorMetadataCarrier,
} from "../../../src/queryplan/operatorMetadata";
import { WhereEnumerator } from "../../../src/enumerators/streaming/where";
import { AllOperator } from "../../../src/operators/all";

const UID = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
let counter = 0;
const nextName = (tag: string): string => `__builtin_${tag}_${UID}_${counter++}`;

describe("internal builtin metadata decorators", () => {
  const registered: string[] = [];
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    for (const fn of cleanups.splice(0)) {
      fn();
    }

    for (const name of registered.splice(0)) {
      OperatorRegistry.unregister(name);
    }
  });

  it("decorated streaming classes expose hidden metadata", () => {
    const metadata = getOperatorMetadata(WhereEnumerator as unknown as IOperatorMetadataCarrier);
    expect(metadata.name).toBe("where");
    expect(metadata.category).toBe("streaming");
  });

  it("decorated terminal classes expose hidden metadata", () => {
    const metadata = getOperatorMetadata(AllOperator as unknown as IOperatorMetadataCarrier);
    expect(metadata.name).toBe("all");
    expect(metadata.category).toBe("terminal");
  });

  it("builtinOperator registers internal metadata without prototype patching", () => {
    const name = nextName("streaming");

    @builtinOperator({ name, kind: "streaming" })
    class TestStreamingBuiltin {
      public constructor(_source: unknown) {}
    }

    registered.push(name);

    const metadata = getOperatorMetadata(TestStreamingBuiltin as unknown as IOperatorMetadataCarrier);
    expect(metadata.name).toBe(name);
    expect(metadata.category).toBe("streaming");

    const registryMeta = OperatorRegistry.get(name);
    expect(registryMeta?.name).toBe(name);
    expect(registryMeta?.kind).toBe("streaming");
    expect(registryMeta?.source).toBe("internal");

    expect((TyneqEnumerableBase.prototype as unknown as Record<string, unknown>)[name]).toBeUndefined();
  });

  it("builtinTerminal registers internal metadata without prototype patching", () => {
    const name = nextName("terminal");

    @builtinTerminal({ name })
    class TestTerminalBuiltin {
      public constructor(_source: unknown) {}
    }

    registered.push(name);

    const metadata = getOperatorMetadata(TestTerminalBuiltin as unknown as IOperatorMetadataCarrier);
    expect(metadata.name).toBe(name);
    expect(metadata.category).toBe("terminal");

    const registryMeta = OperatorRegistry.get(name);
    expect(registryMeta?.name).toBe(name);
    expect(registryMeta?.kind).toBe("terminal");
    expect(registryMeta?.source).toBe("internal");

    expect((TyneqEnumerableBase.prototype as unknown as Record<string, unknown>)[name]).toBeUndefined();
  });

  it("registerBuiltin fires hooks but ignores guards", () => {
    const name = nextName("hooksNoGuards");
    const guard = vi.fn(() => {
      throw new Error("guard should not run for registerBuiltin");
    });
    const hook = vi.fn();

    cleanups.push(OperatorRegistry.addGuard(guard));
    cleanups.push(OperatorRegistry.onRegister(hook));

    expect(() => OperatorRegistry.registerBuiltin(name, "streaming")).not.toThrow();
    registered.push(name);

    expect(guard).not.toHaveBeenCalled();
    expect(hook).toHaveBeenCalledTimes(1);
    expect(hook.mock.calls[0]?.[0]?.metadata?.name).toBe(name);
  });

  it("registerBuiltin throws on duplicate names", () => {
    const name = nextName("duplicate");
    OperatorRegistry.registerBuiltin(name, "buffer");
    registered.push(name);

    expect(() => OperatorRegistry.registerBuiltin(name, "terminal")).toThrow(name);
  });
});
