import { useEffect, useId, useRef, useState } from "react";
import { Button, ProgressBar } from "@/components/ui";
import {
  currentQuestion,
  isCompatibleAttempt,
  nextQuestion,
  passPercent,
  quizXp,
  recordAnswer,
  scoreQuiz,
  startAttempt,
  type Attempt,
  type Quiz,
} from "@/features/quiz/quizLogic";
import { useProgress } from "@/store/progress";
import { lessonKey, type LessonLocation } from "@/store/progressData";

function QuizTimer({
  deadline,
  limit,
  onExpire,
}: {
  deadline: number;
  limit: number;
  onExpire: () => void;
}) {
  const [now, setNow] = useState(Date.now);
  const remaining = Math.max(
    0,
    Math.min(limit, Math.ceil((deadline - now) / 1000)),
  );

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setNow(now);
      if (now >= deadline) onExpire();
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [deadline, onExpire]);

  return (
    <div
      className="quiz-timer"
      role="timer"
      aria-label={`${remaining} seconds remaining`}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle className="timer-track" cx="16" cy="16" r="13" />
        <circle
          className="timer-fill"
          cx="16"
          cy="16"
          r="13"
          pathLength="100"
          strokeDasharray={`${(100 * remaining) / limit} 100`}
        />
      </svg>
      <span>{remaining}s</span>
    </div>
  );
}

function QuizQuestion({
  quiz,
  attempt,
  onAnswer,
  onNext,
  onExpire,
  focusQuestion,
}: {
  quiz: Quiz;
  attempt: Attempt;
  onAnswer: (option: number) => void;
  onNext: () => void;
  onExpire: () => void;
  focusQuestion: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const questionTitle = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const radioName = useId();
  const question = currentQuestion(quiz, attempt);
  const entry = attempt.order[attempt.position];
  const answer = attempt.answers[attempt.position];
  const answered = answer !== undefined;

  useEffect(() => {
    if (focusQuestion) questionTitle.current?.focus();
  }, [focusQuestion]);
  useEffect(() => {
    if (answered) nextButton.current?.focus();
  }, [answered]);

  if (!question || !entry) return null;
  const correct = answer === question.correctIndex;
  const answerXp = correct
    ? quizXp(quiz, attempt) -
      quizXp(quiz, { ...attempt, answers: attempt.answers.slice(0, -1) })
    : 0;

  return (
    <div className="quiz-question">
      <div className="quiz-question-head">
        <p>
          Question {attempt.position + 1} of {attempt.order.length}
        </p>
        {attempt.deadline !== null && question.timeLimitSec && !answered && (
          <QuizTimer
            deadline={attempt.deadline}
            limit={question.timeLimitSec}
            onExpire={onExpire}
          />
        )}
      </div>
      <ProgressBar
        value={attempt.position + (answered ? 1 : 0)}
        max={attempt.order.length}
        label="Questions answered"
      />
      <h2 ref={questionTitle} tabIndex={-1}>
        {question.prompt}
      </h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (selected !== null) onAnswer(selected);
        }}
      >
        <fieldset className="quiz-options" disabled={answered}>
          <legend className="sr-only">Answer options</legend>
          {entry.options.map((originalIndex) => (
            <label className="quiz-option" key={originalIndex}>
              <input
                type="radio"
                name={radioName}
                checked={(answered ? answer : selected) === originalIndex}
                onChange={() => setSelected(originalIndex)}
              />
              <span>{question.options[originalIndex]}</span>
              {answered && originalIndex === question.correctIndex && (
                <span className="quiz-correct-label">Correct answer</span>
              )}
            </label>
          ))}
        </fieldset>
        <div className="quiz-feedback-slot" role="status">
          {answered && (
            <div className="quiz-feedback" data-correct={correct}>
              <strong>
                {answer === null
                  ? "Time is up"
                  : correct
                    ? "Correct"
                    : "Incorrect"}
              </strong>
              <p>{question.explanation}</p>
              {correct && (
                <p className="quiz-answer-xp">
                  +{answerXp} XP {answerXp > 10 && "with combo bonus"}
                </p>
              )}
            </div>
          )}
        </div>
        {answered ? (
          <Button ref={nextButton} onClick={onNext}>
            {attempt.position + 1 === attempt.order.length
              ? "See results"
              : "Next question"}
          </Button>
        ) : (
          <Button type="submit" disabled={selected === null}>
            Check answer
          </Button>
        )}
      </form>
    </div>
  );
}

export function QuizLesson({
  quiz,
  location,
}: {
  quiz: Quiz;
  location: LessonLocation;
}) {
  const key = lessonKey(location);
  const saved = useProgress((state) => state.progress.lessons[key]?.attempt);
  const updateQuiz = useProgress((state) => state.updateQuiz);
  const attempt = saved && isCompatibleAttempt(quiz, saved) ? saved : undefined;
  const [timed, setTimed] = useState(attempt?.timed ?? false);
  const [focusQuestion, setFocusQuestion] = useState(false);
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const isFinished =
    attempt !== undefined && attempt.position === attempt.order.length;
  const offersTimer = quiz.questions.some(
    (question) => question.timeLimitSec !== undefined,
  );

  useEffect(() => {
    if (isFinished && focusQuestion) resultTitle.current?.focus();
  }, [isFinished, focusQuestion]);

  function begin(retry: boolean) {
    setFocusQuestion(true);
    updateQuiz(location, quiz, () =>
      startAttempt(quiz, timed, retry, Date.now()),
    );
  }

  function answer(option: number | null) {
    updateQuiz(location, quiz, (current) =>
      current && current === attempt
        ? recordAnswer(quiz, current, option, Date.now())
        : current,
    );
  }

  const timerOption = offersTimer && (
    <label className="quiz-timing-option">
      <input
        type="checkbox"
        checked={timed}
        onChange={(event) => setTimed(event.target.checked)}
      />
      Enable countdown on timed questions
    </label>
  );

  if (!attempt)
    return (
      <div className="quiz-start">
        <p>
          {quiz.questions.length} questions. Score at least {passPercent}% to
          pass.
        </p>
        {timerOption}
        <Button onClick={() => begin(false)}>Start quiz</Button>
      </div>
    );

  if (isFinished) {
    const score = scoreQuiz(quiz, attempt);
    return (
      <div className="quiz-result">
        <h2 tabIndex={-1} ref={resultTitle}>
          {score.passed ? "Knowledge check passed" : "Keep practising"}
        </h2>
        <p>
          <strong>{score.percent}%</strong> · {score.correct} of {score.total}{" "}
          correct · {passPercent}% to pass
        </p>
        <p>{quizXp(quiz, attempt)} XP from answers in this attempt</p>
        {timerOption}
        <Button variant="secondary" onClick={() => begin(true)}>
          Retry with shuffled questions
        </Button>
      </div>
    );
  }

  return (
    <QuizQuestion
      key={attempt.position}
      quiz={quiz}
      attempt={attempt}
      focusQuestion={focusQuestion}
      onAnswer={answer}
      onExpire={() => answer(null)}
      onNext={() => {
        setFocusQuestion(true);
        updateQuiz(location, quiz, (current) =>
          current && current === attempt
            ? nextQuestion(quiz, current, Date.now())
            : current,
        );
      }}
    />
  );
}
