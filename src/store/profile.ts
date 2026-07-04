import { create } from "zustand";
import { browserStorage } from "@/store/storage";

const key = "cargoready.learner-name.v1";

export const useProfile = create<{
  name: string | null;
  setName: (name: string) => void;
}>((set) => ({
  name: browserStorage.getItem(key),
  setName(value) {
    const name = value.trim().slice(0, 48) || "You";
    browserStorage.setItem(key, name);
    set({ name });
  },
}));
