import { describe, expect, it, vi } from "vitest";
import { defaultPreferences, restorePreferences } from "@/store/preferences";
import { createStorageAdapter } from "@/store/storage";

describe("saved preferences", () => {
  it("retains valid options and fills in missing preferences", () => {
    expect(restorePreferences({ theme: "dark", textSize: "large" })).toEqual({
      ...defaultPreferences,
      theme: "dark",
      textSize: "large",
    });
  });

  it("falls back safely when saved data is invalid", () => {
    expect(restorePreferences(null)).toEqual(defaultPreferences);
    expect(
      restorePreferences({
        theme: "blue",
        textSize: 25,
        reducedMotion: "true",
        sound: 1,
      }),
    ).toEqual(defaultPreferences);
  });
});

describe("browser storage adapter", () => {
  it("keeps separate keys intact across adapter instances", () => {
    const data = new Map<string, string>();
    const backend = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
      removeItem: (key: string) => {
        data.delete(key);
      },
    };
    const first = createStorageAdapter(() => backend);
    first.setItem("progress", "saved progress");
    first.setItem("settings", "dark");
    const reloaded = createStorageAdapter(() => backend);
    expect(reloaded.getItem("settings")).toBe("dark");
    reloaded.removeItem("progress");
    expect(first.getItem("progress")).toBeNull();
    expect(first.getItem("settings")).toBe("dark");
  });

  it("preserves session changes after browser storage fails", () => {
    const storage = createStorageAdapter(() => ({
      getItem: () => "light",
      setItem: () => {
        throw new Error("Quota exceeded");
      },
      removeItem: () => undefined,
    }));
    const onUnavailable = vi.fn();
    storage.subscribe(onUnavailable);
    expect(storage.getItem("settings")).toBe("light");
    storage.setItem("settings", "dark");
    expect(storage.isPersistent()).toBe(false);
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(storage.getItem("settings")).toBe("dark");
    storage.removeItem("settings");
    expect(storage.getItem("settings")).toBeNull();
  });
});
