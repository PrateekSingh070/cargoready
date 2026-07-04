import { describe, expect, it, vi } from "vitest";
import fixture from "@/content/air-cargo-basics.json";
import { courseSchema } from "@/content/schema";
import {
  currentQuestion,
  isCompatibleAttempt,
  nextQuestion,
  recordAnswer,
  scoreQuiz,
  startAttempt,
  type Quiz,
} from "@/features/quiz/quizLogic";
import {
  emptyProgress,
  lessonKey,
  readProgress,
  removeProgress,
  saveQuizAttempt,
  totalXp,
  writeProgress,
} from "@/store/progressData";
import { createStorageAdapter } from "@/store/storage";

const sample = courseSchema
  .parse(fixture)
  .modules[0]?.lessons.find((lesson): lesson is Quiz => lesson.type === "quiz");
if (!sample) throw new Error("Expected a quiz fixture");
const quiz = sample;
const location = { moduleId: "recognising-dangerous-goods", lessonId: quiz.id };
const key = lessonKey(location);

function finishQuiz(numberOfCorrectAnswers: number) {
  let attempt = startAttempt(quiz, false, false, 0);
  for (let index = 0; index < quiz.questions.length; index++) {
    const question = currentQuestion(quiz, attempt);
    if (!question) throw new Error("Expected an active question");
    const option =
      index < numberOfCorrectAnswers
        ? question.correctIndex
        : (question.correctIndex + 1) % question.options.length;
    attempt = nextQuestion(quiz, recordAnswer(quiz, attempt, option, 0), 0);
  }
  return attempt;
}

describe("quiz flow", () => {
  it("collects an answer once and waits for feedback before advancing", () => {
    const started = startAttempt(quiz, false, false, 0);
    expect(nextQuestion(quiz, started, 0)).toBe(started);
    expect(recordAnswer(quiz, started, 99, 0)).toBe(started);
    const answered = recordAnswer(quiz, started, 2, 0);
    expect(answered.answers).toEqual([2]);
    expect(recordAnswer(quiz, answered, 0, 0)).toBe(answered);
    expect(nextQuestion(quiz, answered, 0).position).toBe(1);
  });

  it("honours the deadline and leaves the timer off for untimed attempts", () => {
    const started = startAttempt(quiz, true, false, 1000);
    expect(started.deadline).toBe(26000);
    expect(recordAnswer(quiz, started, null, 25000)).toBe(started);
    expect(recordAnswer(quiz, started, 2, 26000).answers).toEqual([null]);
    expect(startAttempt(quiz, false, false, 1000).deadline).toBeNull();
  });

  it("shuffles questions and options on retry and keeps correct answers mapped", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      let attempt = startAttempt(quiz, false, true, 0);
      expect(attempt.order[0]?.questionId).not.toBe(quiz.questions[0]?.id);
      expect(attempt.order[0]?.options).not.toEqual([0, 1, 2, 3]);
      expect(isCompatibleAttempt(quiz, attempt)).toBe(true);
      for (let index = 0; index < quiz.questions.length; index++) {
        const question = currentQuestion(quiz, attempt);
        if (!question) throw new Error("Expected an active question");
        attempt = nextQuestion(
          quiz,
          recordAnswer(quiz, attempt, question.correctIndex, 0),
          0,
        );
      }
      expect(scoreQuiz(quiz, attempt)).toMatchObject({
        percent: 100,
        passed: true,
      });
    } finally {
      random.mockRestore();
    }
  });

  it("applies the 70% pass mark and retains only the best result for XP", () => {
    expect(scoreQuiz(quiz, finishQuiz(2))).toMatchObject({
      percent: 50,
      passed: false,
    });
    expect(scoreQuiz(quiz, finishQuiz(3))).toMatchObject({
      percent: 75,
      passed: true,
    });
    const best = saveQuizAttempt(emptyProgress, key, quiz, finishQuiz(3));
    const retry = saveQuizAttempt(best, key, quiz, finishQuiz(2));
    expect(retry.lessons[key]).toMatchObject({
      bestCorrect: 3,
      completed: true,
    });
    expect(totalXp(retry)).toBe(58);
  });

  it("saves the resume location and quiz feedback across adapter instances", () => {
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
    const storage = createStorageAdapter(() => backend);
    const attempt = recordAnswer(
      quiz,
      startAttempt(quiz, true, false, 1000),
      2,
      2000,
    );
    const draft = saveQuizAttempt(
      { ...emptyProgress, lastLesson: location },
      key,
      quiz,
      attempt,
    );
    writeProgress(storage, draft);
    const reloaded = createStorageAdapter(() => backend);
    expect(readProgress(reloaded)).toEqual(draft);
    expect(
      isCompatibleAttempt(quiz, readProgress(reloaded).lessons[key]!.attempt!),
    ).toBe(true);
    removeProgress(reloaded);
    expect(readProgress(storage)).toEqual(emptyProgress);
  });
});
