import type { Course } from "@/content/schema";
import { lessonKey, type TrainingProgress } from "@/store/progressData";

export function getJourney(course: Course, progress: TrainingProgress) {
  const cleared = new Set<string>();
  return course.modules.map((module) => {
    const rule = module.unlockRule;
    const unlocked = rule.type === "open" || cleared.has(rule.moduleId);
    const remaining = module.lessons.filter(
      (lesson) =>
        !progress.lessons[
          lessonKey({ moduleId: module.id, lessonId: lesson.id })
        ]?.completed,
    );
    const completed = module.lessons.length - remaining.length;
    const state = !unlocked
      ? "locked"
      : module.lessons.length === 0
        ? "coming"
        : remaining.length === 0
          ? "complete"
          : "open";
    if (state === "complete") cleared.add(module.id);
    return { module, state, completed, nextLesson: remaining[0] };
  });
}
