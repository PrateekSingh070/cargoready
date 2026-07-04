import type { Course } from "@/content/schema";
import { getJourney } from "@/features/course/journey";
import { lessonKey, type TrainingProgress } from "@/store/progressData";

type BadgeContext = {
  course: Course;
  progress: TrainingProgress;
  journey: ReturnType<typeof getJourney>;
};

function hasCompletedType(
  { course, progress }: BadgeContext,
  type: "scenario" | "dragdrop" | "quiz",
  moduleId?: string,
) {
  return course.modules.some(
    (module) =>
      (!moduleId || module.id === moduleId) &&
      module.lessons.some(
        (lesson) =>
          lesson.type === type &&
          progress.lessons[
            lessonKey({ moduleId: module.id, lessonId: lesson.id })
          ]?.completed,
      ),
  );
}

const rules: {
  id: string;
  name: string;
  criteria: string;
  earned: (context: BadgeContext) => boolean;
}[] = [
  {
    id: "first-flight",
    name: "First Flight",
    criteria: "Complete your first lesson.",
    earned: ({ journey }) => journey.some((entry) => entry.completed > 0),
  },
  {
    id: "cargo-coach",
    name: "Cargo Coach",
    criteria: "Reach a scenario ending.",
    earned: (context) => hasCompletedType(context, "scenario"),
  },
  {
    id: "sorted",
    name: "Sorted!",
    criteria: "Finish a sorting activity.",
    earned: (context) => hasCompletedType(context, "dragdrop"),
  },
  {
    id: "knowledge-check",
    name: "Knowledge Check",
    criteria: "Pass any quiz.",
    earned: (context) => hasCompletedType(context, "quiz"),
  },
  {
    id: "perfect-module",
    name: "Perfect Module",
    criteria:
      "Complete a module and get every answer right in each of its quizzes.",
    earned: ({ progress, journey }) =>
      journey.some(({ state, module }) => {
        if (state !== "complete") return false;
        const quizzes = module.lessons.filter(
          (lesson) => lesson.type === "quiz",
        );
        return (
          quizzes.length > 0 &&
          quizzes.every(
            (quiz) =>
              progress.lessons[
                lessonKey({ moduleId: module.id, lessonId: quiz.id })
              ]?.bestCorrect === quiz.questions.length,
          )
        );
      }),
  },
  {
    id: "on-a-roll",
    name: "On a Roll",
    criteria: "Train on three consecutive days.",
    earned: ({ progress }) => (progress.streak?.longest ?? 0) >= 3,
  },
  {
    id: "label-detective",
    name: "Label Detective",
    criteria: "Complete the labels and markings module.",
    earned: ({ journey }) =>
      journey.some(
        ({ state, module }) =>
          module.id === "labels-and-markings" && state === "complete",
      ),
  },
  {
    id: "spill-responder",
    name: "Spill Responder",
    criteria: "Reach an ending in an emergency scenario.",
    earned: (context) =>
      hasCompletedType(context, "scenario", "emergencies-and-spills"),
  },
];

export function evaluateBadges(course: Course, progress: TrainingProgress) {
  const context = { course, progress, journey: getJourney(course, progress) };
  return rules.map(({ earned, ...badge }) => ({
    ...badge,
    earned: earned(context),
  }));
}
