import { z } from "zod";
import {
  attemptSchema,
  missedQuestionIds,
  quizXp,
  scoreQuiz,
  type Attempt,
  type Quiz,
} from "@/features/quiz/quizLogic";
import {
  readScenarioRun,
  scenarioRunSchema,
  type Scenario,
  type ScenarioRun,
} from "@/features/scenario/scenarioLogic";
import type { StorageAdapter } from "@/store/storage";
import {
  isSortingRunCurrent,
  sortingRunSchema,
  type SortingLesson,
  type SortingRun,
} from "@/features/dragdrop/sortingLogic";

const progressKey = "cargoready.progress.v1";
const routeSchema = z.object({ moduleId: z.string(), lessonId: z.string() });
const progressSchema = z.object({
  lastLesson: routeSchema.nullable(),
  streak: z
    .object({
      lastDay: z.number().int(),
      length: z.number().int().positive(),
      longest: z.number().int().positive(),
    })
    .optional(),
  lessons: z.record(
    z.string(),
    z.object({
      completed: z.boolean(),
      bestCorrect: z.number().int().nonnegative().optional(),
      bestQuizXp: z.number().int().nonnegative().optional(),
      attempt: attemptSchema.optional(),
      quizHistory: z
        .array(
          z.object({
            at: z.number().int().nonnegative().max(8_640_000_000_000_000),
            percent: z.number().min(0).max(100),
            missed: z.array(z.string()),
          }),
        )
        .optional(),
      scenarioRun: scenarioRunSchema.optional(),
      bestScenarioScore: z.number().int().nonnegative().optional(),
      sortingRun: sortingRunSchema.optional(),
    }),
  ),
});

export type LessonLocation = z.infer<typeof routeSchema>;
export type TrainingProgress = z.infer<typeof progressSchema>;
export const emptyProgress: TrainingProgress = {
  lastLesson: null,
  lessons: {},
};

export function readProgress(storage: StorageAdapter): TrainingProgress {
  const raw = storage.getItem(progressKey);
  if (!raw) return emptyProgress;
  try {
    const parsed = progressSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyProgress;
  } catch {
    return emptyProgress;
  }
}

export function writeProgress(
  storage: StorageAdapter,
  progress: TrainingProgress,
) {
  storage.setItem(progressKey, JSON.stringify(progress));
}

export function removeProgress(storage: StorageAdapter) {
  storage.removeItem(progressKey);
}

export function lessonKey({ moduleId, lessonId }: LessonLocation) {
  return `${moduleId}/${lessonId}`;
}

export function saveQuizAttempt(
  progress: TrainingProgress,
  key: string,
  quiz: Quiz,
  attempt: Attempt,
  at = Date.now(),
): TrainingProgress {
  const entry = progress.lessons[key];
  const result =
    attempt.position === attempt.order.length
      ? scoreQuiz(quiz, attempt)
      : undefined;
  const bestCorrect = result
    ? Math.max(entry?.bestCorrect ?? 0, result.correct)
    : entry?.bestCorrect;
  const completed = entry?.completed === true || result?.passed === true;
  const bestQuizXp = result
    ? Math.max(
        quizXp(quiz, attempt),
        entry?.bestQuizXp ?? 10 * (entry?.bestCorrect ?? 0),
      )
    : entry?.bestQuizXp;
  const quizHistory =
    result && attempt !== entry?.attempt
      ? [
          ...(entry?.quizHistory ?? []),
          {
            at,
            percent: result.percent,
            missed: missedQuestionIds(quiz, attempt),
          },
        ].slice(-50)
      : entry?.quizHistory;
  return {
    ...progress,
    lessons: {
      ...progress.lessons,
      [key]: {
        ...entry,
        attempt,
        bestCorrect,
        bestQuizXp,
        completed,
        quizHistory,
      },
    },
  };
}

export function totalXp(progress: TrainingProgress) {
  return Object.values(progress.lessons).reduce(
    (total, entry) =>
      total +
      (entry.completed ? 20 : 0) +
      (entry.bestQuizXp ?? 10 * (entry.bestCorrect ?? 0)) +
      (entry.bestScenarioScore ?? 0),
    0,
  );
}

export function saveScenarioRun(
  progress: TrainingProgress,
  key: string,
  scenario: Scenario,
  run: ScenarioRun,
): TrainingProgress {
  const view = readScenarioRun(scenario, run);
  if (!view) return progress;
  const entry = progress.lessons[key];
  return {
    ...progress,
    lessons: {
      ...progress.lessons,
      [key]: {
        ...entry,
        scenarioRun: run,
        completed: !!view.node.outcome || entry?.completed === true,
        bestScenarioScore: view.node.outcome
          ? Math.max(view.score, entry?.bestScenarioScore ?? 0)
          : entry?.bestScenarioScore,
      },
    },
  };
}

export function saveSortingRun(
  progress: TrainingProgress,
  key: string,
  lesson: SortingLesson,
  run: SortingRun,
): TrainingProgress {
  if (!isSortingRunCurrent(lesson, run)) return progress;
  const entry = progress.lessons[key];
  return {
    ...progress,
    lessons: {
      ...progress.lessons,
      [key]: {
        ...entry,
        sortingRun: run,
        completed:
          entry?.completed === true ||
          run.matches.length === lesson.items.length,
      },
    },
  };
}
