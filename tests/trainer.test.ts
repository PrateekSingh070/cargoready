import { describe, expect, it } from "vitest";
import fixture from "@/content/air-cargo-basics.json";
import seed from "@/content/trainer-demo.json";
import { courseSchema } from "@/content/schema";
import {
  filterLearners,
  learnersCsv,
  trainerSnapshot,
  validateDemoLearners,
} from "@/features/trainer-dashboard/analytics";
import {
  currentQuestion,
  nextQuestion,
  recordAnswer,
  startAttempt,
} from "@/features/quiz/quizLogic";
import {
  emptyProgress,
  lessonKey,
  saveQuizAttempt,
} from "@/store/progressData";

const course = courseSchema.parse(fixture);

describe("completed course content", () => {
  it("offers four lessons per module and at least six branching scenarios", () => {
    expect(course.modules.map((module) => module.lessons.length)).toEqual([
      4, 4, 4, 4,
    ]);
    expect(
      course.modules
        .flatMap((module) => module.lessons)
        .filter((lesson) => lesson.type === "scenario"),
    ).toHaveLength(6);
  });
});

describe("trainer analytics", () => {
  it("labels demo and local rows and produces the four chart datasets", () => {
    const demo = validateDemoLearners(seed);
    if (!demo.success) throw demo.error;
    expect(new Set(demo.data.map((learner) => learner.id)).size).toBe(
      demo.data.length,
    );
    const result = trainerSnapshot(course, demo.data, emptyProgress, null);
    expect(result.learners).toHaveLength(seed.length + 1);
    expect(result.learners.find(({ id }) => id === "local")).toMatchObject({
      name: "You",
      source: "This device",
      status: "Not started",
    });
    expect(
      result.learners.filter(({ source }) => source === "Demo"),
    ).toHaveLength(seed.length);
    expect(result.modules).toHaveLength(4);
    expect(result.modules.every(({ score }) => score !== null)).toBe(true);
    expect(result.mostMissed[0]?.count).toBeGreaterThan(0);
    expect(result.trend[0]?.attempts).toBeGreaterThan(0);
    for (const learner of demo.data) {
      for (const [moduleId, record] of Object.entries(learner.modules)) {
        const module = course.modules.find(({ id }) => id === moduleId);
        expect(module).toBeDefined();
        for (const attempt of record.attempts) {
          const quiz = module?.lessons.find(({ id }) => id === attempt.quiz);
          if (quiz?.type !== "quiz") throw new Error("Invalid seed quiz");
          expect(
            attempt.missed.every((id) =>
              quiz.questions.some((question) => question.id === id),
            ),
          ).toBe(true);
          expect(attempt.percent).toBe(
            Math.round(
              (100 * (quiz.questions.length - attempt.missed.length)) /
                quiz.questions.length,
            ),
          );
        }
      }
    }
  });

  it("records a real completed attempt once and updates scores, missed questions and trend", () => {
    const module = course.modules[0]!;
    const quiz = module.lessons.find((lesson) => lesson.type === "quiz");
    if (!quiz) throw new Error("Missing quiz");
    const key = lessonKey({ moduleId: module.id, lessonId: quiz.id });
    const at = Date.UTC(2026, 10, 25, 0, 15);
    let attempt = startAttempt(quiz, false, false, at);
    quiz.questions.forEach((_, index) => {
      const question = currentQuestion(quiz, attempt)!;
      const option =
        index === 0
          ? (question.correctIndex + 1) % question.options.length
          : question.correctIndex;
      attempt = nextQuestion(quiz, recordAnswer(quiz, attempt, option, at), at);
    });
    const saved = saveQuizAttempt(emptyProgress, key, quiz, attempt, at);
    const replayed = saveQuizAttempt(saved, key, quiz, attempt, at);
    expect(replayed.lessons[key]?.quizHistory).toHaveLength(1);
    const result = trainerSnapshot(course, [], replayed, "Local Learner");
    expect(result.learners[0]).toMatchObject({
      name: "Local Learner",
      source: "This device",
      average: 75,
      status: "In progress",
    });
    expect(result.modules[0]?.score).toBe(75);
    expect(result.trend).toEqual([
      { day: "2026-11-25", score: 75, attempts: 1 },
    ]);
    expect(result.mostMissed[0]).toMatchObject({
      prompt: quiz.questions[0]?.prompt,
      count: 1,
    });
  });

  it("filters and sorts learner rows, and escapes CSV names safely", () => {
    const demo = validateDemoLearners(seed);
    if (!demo.success) throw demo.error;
    const rows = trainerSnapshot(
      course,
      demo.data,
      emptyProgress,
      '=SUM(1, "2")',
    ).learners;
    expect(
      filterLearners(rows, "", "Complete", "progress").map(
        (row) => row.completed,
      ),
    ).toEqual([4, 4]);
    const local = filterLearners(rows, "this device", "Not started", "score");
    expect(local).toHaveLength(1);
    const csv = learnersCsv(local, course.modules.length);
    expect(csv).toContain(
      `"'=SUM(1, ""2"")","This device","Not started","0","4",""`,
    );
    expect(csv).not.toContain("Asha");
  });
});
