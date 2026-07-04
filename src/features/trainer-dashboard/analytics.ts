import { z } from "zod";
import type { Course } from "@/content/schema";
import {
  isCompatibleAttempt,
  missedQuestionIds,
  scoreQuiz,
} from "@/features/quiz/quizLogic";
import { lessonKey, type TrainingProgress } from "@/store/progressData";

type Result = {
  day: string | null;
  percent: number;
  quiz: string;
  missed: string[];
};
type ModuleRecord = {
  completed: boolean;
  inProgress: boolean;
  attempts: Result[];
};

const seed = z.array(
  z.object({
    id: z.string().startsWith("demo-"),
    name: z.string().min(1),
    modules: z.record(
      z.string(),
      z.object({
        completed: z.boolean(),
        inProgress: z.boolean(),
        attempts: z.array(
          z.object({
            day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            percent: z.number().min(0).max(100),
            quiz: z.string(),
            missed: z.array(z.string()),
          }),
        ),
      }),
    ),
  }),
);

export function validateDemoLearners(input: unknown) {
  return seed.safeParse(input);
}

export const statusOptions = [
  "Not started",
  "In progress",
  "Complete",
] as const;
type LearnerStatus = (typeof statusOptions)[number];
export type LearnerRow = {
  id: string;
  name: string;
  source: "Demo" | "This device";
  status: LearnerStatus;
  completed: number;
  average: number | null;
};
type Learner = LearnerRow & { modules: Record<string, ModuleRecord> };

function average(values: number[]) {
  return values.length
    ? Math.round(
        (10 * values.reduce((sum, value) => sum + value, 0)) / values.length,
      ) / 10
    : null;
}

function learnerRow(
  course: Course,
  id: string,
  name: string,
  source: Learner["source"],
  modules: Learner["modules"],
): Learner {
  const records = course.modules.flatMap((module) =>
    modules[module.id] ? [modules[module.id]!] : [],
  );
  const completed = records.filter((record) => record.completed).length;
  const status = records.some((record) => record.inProgress || record.completed)
    ? completed === course.modules.length
      ? "Complete"
      : "In progress"
    : "Not started";
  return {
    id,
    name,
    source,
    status,
    completed,
    modules,
    average: average(
      records.flatMap((module) =>
        module.attempts.map((attempt) => attempt.percent),
      ),
    ),
  };
}

function localModules(
  course: Course,
  progress: TrainingProgress,
): Learner["modules"] {
  return Object.fromEntries(
    course.modules.map((module) => {
      const entries = module.lessons.map(
        (lesson) =>
          progress.lessons[
            lessonKey({ moduleId: module.id, lessonId: lesson.id })
          ],
      );
      const attempts = module.lessons.flatMap((lesson, index): Result[] => {
        const entry = entries[index];
        if (lesson.type !== "quiz" || !entry) return [];
        if (entry.quizHistory?.length)
          return entry.quizHistory.map((result) => ({
            day: new Date(result.at).toISOString().slice(0, 10),
            percent: result.percent,
            quiz: lesson.id,
            missed: result.missed,
          }));
        const attempt = entry.attempt;
        if (
          attempt &&
          attempt.position === attempt.order.length &&
          isCompatibleAttempt(lesson, attempt)
        ) {
          return [
            {
              day: null,
              percent: scoreQuiz(lesson, attempt).percent,
              quiz: lesson.id,
              missed: missedQuestionIds(lesson, attempt),
            },
          ];
        }
        return entry.bestCorrect === undefined
          ? []
          : [
              {
                day: null,
                percent: Math.min(
                  100,
                  Math.round(
                    (100 * entry.bestCorrect) / lesson.questions.length,
                  ),
                ),
                quiz: lesson.id,
                missed: [],
              },
            ];
      });
      return [
        module.id,
        {
          completed:
            entries.length > 0 && entries.every((entry) => entry?.completed),
          inProgress:
            entries.some(Boolean) ||
            progress.lastLesson?.moduleId === module.id,
          attempts,
        },
      ];
    }),
  );
}

export function trainerSnapshot(
  course: Course,
  demo: z.infer<typeof seed>,
  progress: TrainingProgress,
  name: string | null,
) {
  const learners = [
    ...demo.map(({ id, name, modules }) =>
      learnerRow(course, id, name, "Demo", modules),
    ),
    learnerRow(
      course,
      "local",
      name || "You",
      "This device",
      localModules(course, progress),
    ),
  ];
  const misses = new Map<
    string,
    { prompt: string; module: string; count: number }
  >();
  const byDay = new Map<string, number[]>();
  const modules = course.modules.map((module, index) => {
    const records = learners.map((learner) => learner.modules[module.id]);
    const attempts = records.flatMap((record) => record?.attempts ?? []);
    attempts.forEach((attempt) => {
      const quiz = module.lessons.find((lesson) => lesson.id === attempt.quiz);
      if (quiz?.type !== "quiz") return;
      if (attempt.day) {
        const day = byDay.get(attempt.day) ?? [];
        day.push(attempt.percent);
        byDay.set(attempt.day, day);
      }
      new Set(attempt.missed).forEach((questionId) => {
        const question = quiz.questions.find(({ id }) => id === questionId);
        if (!question) return;
        const key = `${module.id}/${quiz.id}/${question.id}`;
        const prior = misses.get(key);
        misses.set(key, {
          prompt: question.prompt,
          module: module.title,
          count: (prior?.count ?? 0) + 1,
        });
      });
    });
    return {
      label: `Module ${index + 1}`,
      title: module.title,
      completion: Math.round(
        (100 * records.filter((record) => record?.completed).length) /
          learners.length,
      ),
      score: average(attempts.map((attempt) => attempt.percent)),
    };
  });
  const mostMissed = [...misses.values()]
    .sort(
      (left, right) =>
        right.count - left.count || left.prompt.localeCompare(right.prompt),
    )
    .slice(0, 5)
    .map((question, index) => ({ ...question, label: `#${index + 1}` }));
  const trend = [...byDay]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([day, scores]) => ({
      day,
      score: average(scores) ?? 0,
      attempts: scores.length,
    }));
  return { learners, modules, mostMissed, trend };
}

export type TrainerSnapshot = ReturnType<typeof trainerSnapshot>;
export type LearnerSort = "name" | "progress" | "score";

export function filterLearners(
  rows: readonly LearnerRow[],
  query: string,
  status: LearnerStatus | "All",
  sort: LearnerSort,
) {
  const term = query.trim().toLocaleLowerCase();
  return rows
    .filter(
      (row) =>
        (status === "All" || row.status === status) &&
        (row.name.toLocaleLowerCase().includes(term) ||
          row.source.toLocaleLowerCase().includes(term)),
    )
    .sort(
      (left, right) =>
        (sort === "progress"
          ? right.completed - left.completed
          : sort === "score"
            ? (right.average ?? -1) - (left.average ?? -1)
            : 0) || left.name.localeCompare(right.name),
    );
}

function csvCell(value: string | number) {
  const text = String(value);
  const safe =
    typeof value === "string" &&
    (/^\s*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))
      ? `'${text}`
      : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function learnersCsv(rows: readonly LearnerRow[], moduleCount: number) {
  return (
    [
      [
        "Learner",
        "Source",
        "Status",
        "Modules completed",
        "Modules available",
        "Average quiz score (%)",
      ],
      ...rows.map((row) => [
        row.name,
        row.source,
        row.status,
        row.completed,
        moduleCount,
        row.average ?? "",
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n") + "\r\n"
  );
}
