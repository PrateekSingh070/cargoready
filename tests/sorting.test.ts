import { describe, expect, it } from "vitest";
import fixture from "@/content/air-cargo-basics.json";
import { courseSchema } from "@/content/schema";
import {
  emptySortingRun,
  isSortingRunCurrent,
  nextTargetIndex,
  placeCargo,
  type SortingLesson,
} from "@/features/dragdrop/sortingLogic";
import {
  emptyProgress,
  readProgress,
  saveSortingRun,
  totalXp,
  writeProgress,
} from "@/store/progressData";
import { createStorageAdapter } from "@/store/storage";

const sample = courseSchema
  .parse(fixture)
  .modules[0]?.lessons.find(
    (lesson): lesson is SortingLesson => lesson.type === "dragdrop",
  );
if (!sample) throw new Error("Expected a sorting lesson fixture");
const lesson = sample;
const key = "recognising-dangerous-goods/sort-the-samples";

describe("sorting activity", () => {
  it("counts two misses for the selected item without changing other items", () => {
    const first = placeCargo(lesson, emptySortingRun, "dry-ice", "gases");
    expect(first.status).toBe("incorrect");
    expect(first.run.misses).toEqual({ "dry-ice": 1 });
    const second = placeCargo(lesson, first.run, "dry-ice", "liquids");
    expect(second.run.misses).toEqual({ "dry-ice": 2 });
    expect(
      placeCargo(lesson, second.run, "dry-ice", "gases").run.misses,
    ).toEqual({ "dry-ice": 2 });
  });

  it("places a correct item once and ignores unknown cargo or bins", () => {
    const correct = placeCargo(
      lesson,
      emptySortingRun,
      "dry-ice",
      "miscellaneous",
    );
    expect(correct.status).toBe("correct");
    expect(correct.run.matches).toEqual([
      { itemId: "dry-ice", targetId: "miscellaneous" },
    ]);
    expect(
      placeCargo(lesson, correct.run, "dry-ice", "miscellaneous").run,
    ).toBe(correct.run);
    expect(placeCargo(lesson, correct.run, "missing", "gases").status).toBe(
      "ignored",
    );
    expect(
      placeCargo(lesson, correct.run, "aerosol-spray-paint", "missing").status,
    ).toBe("ignored");
    expect(
      isSortingRunCurrent(lesson, {
        ...correct.run,
        matches: [{ itemId: "dry-ice", targetId: "gases" }],
      }),
    ).toBe(false);
  });

  it("cycles bins in reading order with all four arrow keys", () => {
    expect(nextTargetIndex("ArrowRight", -1, 3)).toBe(0);
    expect(nextTargetIndex("ArrowLeft", -1, 3)).toBe(2);
    expect(nextTargetIndex("ArrowDown", 2, 3)).toBe(0);
    expect(nextTargetIndex("ArrowUp", 0, 3)).toBe(2);
    expect(nextTargetIndex("Space", 1, 3)).toBeUndefined();
    expect(nextTargetIndex("ArrowDown", -1, 0)).toBeUndefined();
  });

  it("restores saved matches and awards completion XP once", () => {
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
    const draft = placeCargo(
      lesson,
      emptySortingRun,
      "dry-ice",
      "miscellaneous",
    ).run;
    const progress = saveSortingRun(emptyProgress, key, lesson, draft);
    expect(totalXp(progress)).toBe(0);
    writeProgress(
      createStorageAdapter(() => backend),
      progress,
    );
    const resumed = readProgress(createStorageAdapter(() => backend));
    expect(resumed.lessons[key]?.sortingRun).toEqual(draft);

    const completedRun = lesson.items.reduce((run, item) => {
      const target = lesson.correctMap[item.id];
      if (!target) throw new Error("Expected a target");
      return placeCargo(lesson, run, item.id, target).run;
    }, draft);
    const completed = saveSortingRun(resumed, key, lesson, completedRun);
    const replay = saveSortingRun(completed, key, lesson, emptySortingRun);
    expect(completed.lessons[key]?.completed).toBe(true);
    expect(totalXp(completed)).toBe(20);
    expect(totalXp(saveSortingRun(replay, key, lesson, completedRun))).toBe(20);
  });
});
