import { z } from "zod";
import type { Lesson } from "@/content/schema";

export type SortingLesson = Extract<Lesson, { type: "dragdrop" }>;
export const sortingRunSchema = z.object({
  matches: z.array(z.object({ itemId: z.string(), targetId: z.string() })),
  misses: z.record(z.string(), z.number().int().min(1).max(2)),
});
export type SortingRun = z.infer<typeof sortingRunSchema>;
export const emptySortingRun: SortingRun = { matches: [], misses: {} };

export function isSortingRunCurrent(lesson: SortingLesson, run: SortingRun) {
  const itemIds = new Set(lesson.items.map((item) => item.id));
  return (
    new Set(run.matches.map(({ itemId }) => itemId)).size ===
      run.matches.length &&
    run.matches.every(
      ({ itemId, targetId }) =>
        itemIds.has(itemId) && lesson.correctMap[itemId] === targetId,
    ) &&
    Object.keys(run.misses).every((itemId) => itemIds.has(itemId))
  );
}

export function placeCargo(
  lesson: SortingLesson,
  run: SortingRun,
  itemId: string,
  targetId: string,
): { status: "ignored" | "correct" | "incorrect"; run: SortingRun } {
  if (
    !lesson.items.some((item) => item.id === itemId) ||
    !lesson.targets.some((target) => target.id === targetId) ||
    run.matches.some((match) => match.itemId === itemId)
  ) {
    return { status: "ignored", run };
  }

  if (lesson.correctMap[itemId] === targetId) {
    return {
      status: "correct",
      run: { ...run, matches: [...run.matches, { itemId, targetId }] },
    };
  }

  const misses = Math.min(2, (run.misses[itemId] ?? 0) + 1);
  return {
    status: "incorrect",
    run: { ...run, misses: { ...run.misses, [itemId]: misses } },
  };
}

/** Cycle through targets in reading order, even when the grid wraps. */
export function nextTargetIndex(key: string, current: number, count: number) {
  if (count === 0) return;
  const forwards = key === "ArrowRight" || key === "ArrowDown";
  if (!forwards && key !== "ArrowLeft" && key !== "ArrowUp") return;
  if (current < 0) return forwards ? 0 : count - 1;
  return (current + (forwards ? 1 : -1) + count) % count;
}
