import { describe, expect, it } from "vitest";
import fixture from "@/content/air-cargo-basics.json";
import { courseSchema } from "@/content/schema";
import {
  chooseScenarioOption,
  continueScenario,
  openingRun,
  readScenarioRun,
  type Scenario,
  type ScenarioRun,
} from "@/features/scenario/scenarioLogic";
import {
  emptyProgress,
  readProgress,
  saveScenarioRun,
  totalXp,
  writeProgress,
} from "@/store/progressData";
import { createStorageAdapter } from "@/store/storage";

const sample = courseSchema
  .parse(fixture)
  .modules[0]?.lessons.find(
    (lesson): lesson is Scenario => lesson.type === "scenario",
  );
if (!sample) throw new Error("Expected a scenario fixture");
const scenario = sample;
const key = "recognising-dangerous-goods/event-supplies";

function play(choices: number[]) {
  return choices.reduce(
    (run, choice) =>
      continueScenario(chooseScenarioOption(scenario, run, choice)),
    openingRun,
  );
}

describe("scenario branching", () => {
  it.each([
    { choices: [0, 0], ending: "review", score: 20 },
    { choices: [0, 1], ending: "incomplete-handoff", score: 10 },
    { choices: [1], ending: "missed", score: -5 },
  ])(
    "reaches $ending via $choices and scores $score",
    ({ choices, ending, score }) => {
      const view = readScenarioRun(scenario, play(choices));
      expect(view?.node.id).toBe(ending);
      expect(view?.node.outcome).toBeDefined();
      expect(view?.steps).toHaveLength(choices.length);
      expect(view?.score).toBe(score);
    },
  );

  it("shows feedback at the decision before following the branch", () => {
    const pending = chooseScenarioOption(scenario, openingRun, 0);
    expect(readScenarioRun(scenario, pending)).toMatchObject({
      node: { id: "at-the-desk" },
      feedback: { isSafe: true, scoreDelta: 10 },
    });
    expect(chooseScenarioOption(scenario, pending, 1)).toBe(pending);
    expect(readScenarioRun(scenario, continueScenario(pending))?.node.id).toBe(
      "handoff",
    );
  });

  it("rejects a saved trail when choice links no longer match", () => {
    const invalid: ScenarioRun = {
      reviewing: true,
      trail: [{ nodeId: "at-the-desk", choiceIndex: 0, nextNodeId: "missed" }],
    };
    expect(readScenarioRun(scenario, invalid)).toBeUndefined();
    expect(saveScenarioRun(emptyProgress, key, scenario, invalid)).toBe(
      emptyProgress,
    );
  });
});

describe("scenario progression", () => {
  it("bank scores once and keeps completion when a different path is replayed", () => {
    const feedback = chooseScenarioOption(scenario, openingRun, 1);
    const draft = saveScenarioRun(emptyProgress, key, scenario, feedback);
    expect(draft.lessons[key]?.completed).toBe(false);
    expect(totalXp(draft)).toBe(0);
    const completed = saveScenarioRun(draft, key, scenario, play([0, 0]));
    expect(totalXp(completed)).toBe(40);
    const replay = saveScenarioRun(completed, key, scenario, openingRun);
    const alternate = saveScenarioRun(replay, key, scenario, play([1]));
    expect(alternate.lessons[key]).toMatchObject({
      bestScenarioScore: 20,
      completed: true,
    });
    expect(totalXp(alternate)).toBe(40);
  });

  it("restores the visible scene and feedback from a saved decision", () => {
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
    const draft = chooseScenarioOption(scenario, play([0]), 1);
    writeProgress(
      createStorageAdapter(() => backend),
      saveScenarioRun(emptyProgress, key, scenario, draft),
    );
    const resumed = readProgress(createStorageAdapter(() => backend)).lessons[
      key
    ]?.scenarioRun;
    expect(resumed).toEqual(draft);
    expect(readScenarioRun(scenario, resumed!)).toMatchObject({
      node: { id: "handoff" },
      feedback: { isSafe: false },
    });
  });
});
