import { z } from "zod";
import type { Lesson } from "@/content/schema";
import { pointsForQuiz } from "@/features/gamification/rewardMath";

export type Quiz = Extract<Lesson, { type: "quiz" }>;
const index = z.number().int().nonnegative();

export const attemptSchema = z.object({
  order: z
    .array(z.object({ questionId: z.string(), options: z.array(index) }))
    .min(1),
  answers: z.array(index.nullable()),
  position: index,
  timed: z.boolean(),
  deadline: index.nullable(),
});
export type Attempt = z.infer<typeof attemptSchema>;

function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    const item = result.splice(other, 1);
    result.splice(index, 0, ...item);
  }
  return result;
}

export function startAttempt(
  quiz: Quiz,
  timed: boolean,
  retry: boolean,
  now: number,
): Attempt {
  const questions = retry ? shuffled(quiz.questions) : quiz.questions;
  const order = questions.map((question) => {
    const options = question.options.map((_, index) => index);
    return {
      questionId: question.id,
      options: retry ? shuffled(options) : options,
    };
  });
  return {
    order,
    answers: [],
    position: 0,
    timed,
    deadline: deadlineFor(timed, questions[0]?.timeLimitSec, now),
  };
}

function deadlineFor(timed: boolean, limit: number | undefined, now: number) {
  return timed && limit ? now + limit * 1000 : null;
}

export function currentQuestion(quiz: Quiz, attempt: Attempt) {
  const entry = attempt.order[attempt.position];
  return (
    entry && quiz.questions.find((question) => question.id === entry.questionId)
  );
}

/** Stored question and option IDs must still match the current lesson. */
export function isCompatibleAttempt(quiz: Quiz, attempt: Attempt) {
  if (
    attempt.order.length !== quiz.questions.length ||
    new Set(attempt.order.map((entry) => entry.questionId)).size !==
      quiz.questions.length ||
    attempt.position > attempt.order.length ||
    attempt.answers.length < attempt.position ||
    attempt.answers.length >
      Math.min(attempt.position + 1, attempt.order.length)
  )
    return false;
  const awaitingTimedAnswer =
    attempt.timed &&
    attempt.answers.length === attempt.position &&
    currentQuestion(quiz, attempt)?.timeLimitSec !== undefined;
  if (awaitingTimedAnswer !== (attempt.deadline !== null)) return false;

  return attempt.order.every((entry, position) => {
    const question = quiz.questions.find(
      (candidate) => candidate.id === entry.questionId,
    );
    const answer = attempt.answers[position];
    return (
      question &&
      entry.options.length === question.options.length &&
      new Set(entry.options).size === question.options.length &&
      entry.options.every((option) => option < question.options.length) &&
      (answer == null || entry.options.includes(answer))
    );
  });
}

export function recordAnswer(
  quiz: Quiz,
  attempt: Attempt,
  option: number | null,
  now: number,
): Attempt {
  const question = currentQuestion(quiz, attempt);
  if (!question || attempt.answers.length !== attempt.position) return attempt;
  const expired = attempt.deadline !== null && now >= attempt.deadline;
  if (
    !expired &&
    (option === null ||
      !attempt.order[attempt.position]?.options.includes(option))
  )
    return attempt;
  return {
    ...attempt,
    deadline: null,
    answers: [...attempt.answers, expired ? null : option],
  };
}

export function nextQuestion(
  quiz: Quiz,
  attempt: Attempt,
  now: number,
): Attempt {
  if (attempt.answers.length !== attempt.position + 1) return attempt;
  const next = { ...attempt, position: attempt.position + 1 };
  return {
    ...next,
    deadline: deadlineFor(
      attempt.timed,
      currentQuestion(quiz, next)?.timeLimitSec,
      now,
    ),
  };
}

export const passPercent = 70;

export function scoreQuiz(quiz: Quiz, attempt: Attempt) {
  const total = quiz.questions.length;
  const correct = attempt.order.filter((entry, index) => {
    const question = quiz.questions.find(
      (candidate) => candidate.id === entry.questionId,
    );
    return (
      question !== undefined && attempt.answers[index] === question.correctIndex
    );
  }).length;
  return {
    correct,
    total,
    percent: Math.round((100 * correct) / total),
    passed: 100 * correct >= passPercent * total,
  };
}

export function quizXp(quiz: Quiz, attempt: Attempt) {
  return pointsForQuiz(
    attempt.order.map((entry, index) => {
      const question = quiz.questions.find(
        (candidate) => candidate.id === entry.questionId,
      );
      return (
        question !== undefined &&
        attempt.answers[index] === question.correctIndex
      );
    }),
  );
}

export function missedQuestionIds(quiz: Quiz, attempt: Attempt) {
  return attempt.order.flatMap((entry, index) => {
    const question = quiz.questions.find(
      (candidate) => candidate.id === entry.questionId,
    );
    return question && attempt.answers[index] !== question.correctIndex
      ? [question.id]
      : [];
  });
}
