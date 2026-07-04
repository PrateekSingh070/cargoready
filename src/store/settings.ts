import { create } from "zustand";
import { browserStorage } from "@/store/storage";
import {
  defaultPreferences,
  restorePreferences,
  type Preferences,
} from "@/store/preferences";

const settingsKey = "cargoready.settings.v1";

function readSettings(): Preferences {
  try {
    const raw = browserStorage.getItem(settingsKey);
    return raw ? restorePreferences(JSON.parse(raw)) : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

export const useSettings = create<{
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => void;
}>((set) => ({
  preferences: readSettings(),
  setPreference: (key, value) => {
    set((state) => {
      const preferences = { ...state.preferences, [key]: value };
      browserStorage.setItem(settingsKey, JSON.stringify(preferences));
      return { preferences };
    });
  },
}));
