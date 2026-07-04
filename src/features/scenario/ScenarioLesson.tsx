import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui";
import { CoachAvatar } from "@/features/scenario/CoachAvatar";
import {
  chooseScenarioOption,
  continueScenario,
  openingRun,
  readScenarioRun,
  type Scenario,
  type ScenarioRun,
} from "@/features/scenario/scenarioLogic";
import { useProgress } from "@/store/progress";
import { lessonKey, type LessonLocation } from "@/store/progressData";

export function ScenarioLesson({
  scenario,
  location,
}: {
  scenario: Scenario;
  location: LessonLocation;
}) {
  const saved = useProgress(
    (state) => state.progress.lessons[lessonKey(location)]?.scenarioRun,
  );
  const updateScenario = useProgress((state) => state.updateScenario);
  const [moveFocus, setMoveFocus] = useState(false);
  const feedbackTitle = useRef<HTMLHeadingElement>(null);
  const sceneTitle = useRef<HTMLHeadingElement>(null);
  const run = saved && readScenarioRun(scenario, saved) ? saved : openingRun;
  const view = readScenarioRun(scenario, run);

  useEffect(() => {
    if (moveFocus)
      (run.reviewing ? feedbackTitle.current : sceneTitle.current)?.focus();
  }, [moveFocus, run]);

  if (!view) return <p className="notice">This scenario is unavailable.</p>;
  const { node, feedback, score, steps } = view;
  const mood = feedback
    ? feedback.isSafe
      ? "pleased"
      : "thoughtful"
    : node.outcome
      ? steps.every((step) => step.choice.isSafe)
        ? "pleased"
        : "thoughtful"
      : "neutral";

  function act(update: (current: ScenarioRun) => ScenarioRun) {
    setMoveFocus(true);
    updateScenario(location, scenario, (current) =>
      current === run ? update(current) : current,
    );
  }

  return (
    <div className="scenario">
      {run === openingRun && <p className="lesson-intro">{scenario.intro}</p>}
      <div className="scenario-context">
        <span>
          <Icon name={node.illustration} />{" "}
          {node.outcome
            ? "Outcome"
            : `Decision ${steps.length + (feedback ? 0 : 1)}`}
        </span>
        <span>
          Scenario score <strong>{score}</strong>
        </span>
      </div>
      <div className="scenario-scene">
        {!feedback && !node.outcome && <CoachAvatar mood="neutral" />}
        <h2 ref={sceneTitle} tabIndex={-1}>
          {node.text}
        </h2>
      </div>
      {node.outcome && (
        <div className="scenario-summary">
          <div className="scenario-review">
            <section>
              <h3>What went right</h3>
              <p>{node.outcome.whatWentRight}</p>
            </section>
            <section>
              <h3>What to review</h3>
              <p>{node.outcome.whatToReview}</p>
            </section>
          </div>
          <h3>Your path</h3>
          <ol className="scenario-trail">
            {steps.map(({ node, choice }) => (
              <li key={node.id}>
                <span>{choice.label}</span>
                <span>
                  {choice.scoreDelta > 0 ? "+" : ""}
                  {choice.scoreDelta} pts
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {feedback || node.outcome ? (
        <div className="scenario-coach">
          <CoachAvatar mood={mood} />
          <div>
            <p className="coach-name">Mira, your cargo coach</p>
            {feedback ? (
              <>
                <h3 tabIndex={-1} ref={feedbackTitle}>
                  {feedback.isSafe ? "Good call" : "Review this choice"} ·{" "}
                  {feedback.scoreDelta > 0 ? "+" : ""}
                  {feedback.scoreDelta} pts
                </h3>
                <p>{feedback.feedback}</p>
              </>
            ) : (
              <p>{node.outcome?.summary}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="scenario-choices">
          <p>Choose what you would do.</p>
          {node.choices.map((choice, index) => (
            <Button
              key={choice.label}
              variant="secondary"
              onClick={() =>
                act((current) => chooseScenarioOption(scenario, current, index))
              }
            >
              {choice.label}
              <Icon name="arrow" />
            </Button>
          ))}
        </div>
      )}
      {feedback && (
        <Button onClick={() => act(continueScenario)}>
          Continue <Icon name="arrow" />
        </Button>
      )}
      {node.outcome && (
        <Button variant="secondary" onClick={() => act(() => openingRun)}>
          Try another path
        </Button>
      )}
      {node.outcome && scenario.source && (
        <a className="text-link" href={scenario.source.url}>
          {scenario.source.label}
        </a>
      )}
    </div>
  );
}
