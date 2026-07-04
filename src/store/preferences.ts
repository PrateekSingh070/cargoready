export const textSizes = ["small", "standard", "large"] as const;

export type Preferences = {
  theme: "light" | "dark";
  textSize: (typeof textSizes)[number];
  reducedMotion: boolean;
  sound: boolean;
};

export const defaultPreferences: Preferences = {
  theme: "light",
  textSize: "standard",
  reducedMotion: false,
  sound: false,
};

export function restorePreferences(value: unknown): Preferences {
  if (typeof value !== "object" || value === null) return defaultPreferences;

  const stored = value as Partial<Record<keyof Preferences, unknown>>;
  return {
    theme: stored.theme === "dark" ? "dark" : "light",
    textSize:
      stored.textSize === "small" || stored.textSize === "large"
        ? stored.textSize
        : "standard",
    reducedMotion: stored.reducedMotion === true,
    sound: stored.sound === true,
  };
}
