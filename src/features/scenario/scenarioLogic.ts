import { z } from "zod";
import type { Lesson } from "@/content/schema";

export type Scenario = Extract<Lesson, { type: "scenario" }>;
type ScenarioNode = Scenario["nodes"][number];
type Choice = ScenarioNode["choices"][number];

export const scenarioRunSchema = z.object({
  trail: z.array(
    z.object({
      nodeId: z.string(),
      choiceIndex: z.number().int().nonnegative(),
      nextNodeId: z.string(),
    }),
  ),
  reviewing: z.boolean(),
});
export type ScenarioRun = z.infer<typeof scenarioRunSchema>;
export const openingRun: ScenarioRun = { trail: [], reviewing: false };

type TrailStep = { node: ScenarioNode; choice: Choice };

/** Replay saved decisions against current content before showing the scene. */
export function readScenarioRun(scenario: Scenario, run: ScenarioRun) {
  let node = scenario.nodes[0];
  const visited = new Set<string>();
  const steps: TrailStep[] = [];
  for (const step of run.trail) {
    if (!node || node.id !== step.nodeId || visited.has(node.id)) return;
    const choice = node.choices[step.choiceIndex];
    if (!choice || choice.nextNodeId !== step.nextNodeId) return;
    steps.push({ node, choice });
    visited.add(node.id);
    node = scenario.nodes.find((candidate) => candidate.id === step.nextNodeId);
  }
  const latest = steps.at(-1);
  if (!node || visited.has(node.id) || (run.reviewing && !latest)) return;

  return {
    node: run.reviewing && latest ? latest.node : node,
    feedback: run.reviewing ? latest?.choice : undefined,
    steps,
    score: steps.reduce((score, step) => score + step.choice.scoreDelta, 0),
  };
}

export function chooseScenarioOption(
  scenario: Scenario,
  run: ScenarioRun,
  choiceIndex: number,
): ScenarioRun {
  if (run.reviewing) return run;
  const node = readScenarioRun(scenario, run)?.node;
  const choice = node?.choices[choiceIndex];
  if (!node || !choice) return run;

  return {
    trail: [
      ...run.trail,
      { nodeId: node.id, choiceIndex, nextNodeId: choice.nextNodeId },
    ],
    reviewing: true,
  };
}

export function continueScenario(run: ScenarioRun): ScenarioRun {
  return run.reviewing ? { ...run, reviewing: false } : run;
}
