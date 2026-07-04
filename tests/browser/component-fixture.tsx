import { fireEvent, render, screen } from "@testing-library/react";
import { courseContent } from "@/content/course";
import { QuizLesson } from "@/features/quiz/QuizLesson";
import { ScenarioLesson } from "@/features/scenario/ScenarioLesson";
import { useProgress } from "@/store/progress";

async function checkQuiz() {
  if (!courseContent.success) throw new Error("The course did not load");
  const module = courseContent.data.modules[0]!;
  const quiz = module.lessons.find((lesson) => lesson.type === "quiz");
  if (!quiz) throw new Error("The quiz did not load");
  const location = { moduleId: module.id, lessonId: quiz.id };
  const firstMount = render(<QuizLesson quiz={quiz} location={location} />);
  fireEvent.click(screen.getByRole("button", { name: "Start quiz" }));
  fireEvent.click(screen.getByRole("radio", { name: "Nine" }));
  fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
  await screen.findByText("Correct", { exact: true });
  firstMount.unmount();
  const secondMount = render(<QuizLesson quiz={quiz} location={location} />);
  await screen.findByText(quiz.questions[0]!.explanation);
  fireEvent.click(screen.getByRole("button", { name: "Next question" }));
  await screen.findByText("Question 2 of 4");
  secondMount.unmount();
}

async function checkScenarios() {
  if (!courseContent.success) throw new Error("The course did not load");
  for (const module of courseContent.data.modules) {
    for (const scenario of module.lessons) {
      if (scenario.type !== "scenario") continue;
      const location = { moduleId: module.id, lessonId: scenario.id };
      const nodes = scenario.nodes;
      const first = nodes[0]!;
      const paths: number[][] = [];
      function enumerate(nodeId: string, path: number[]) {
        const node = nodes.find((entry) => entry.id === nodeId);
        if (!node) throw new Error(`Unknown scenario node: ${nodeId}`);
        if (node.outcome) paths.push(path);
        else
          node.choices.forEach((choice, index) =>
            enumerate(choice.nextNodeId, [...path, index]),
          );
      }
      enumerate(first.id, []);
      for (const path of paths) {
        useProgress.getState().reset();
        const component = render(
          <ScenarioLesson scenario={scenario} location={location} />,
        );
        let node = first;
        for (const index of path) {
          const choice = node.choices[index]!;
          fireEvent.click(
            screen.getByRole("button", { name: (name) => name === choice.label }),
          );
          await screen.findByText(choice.feedback);
          fireEvent.click(screen.getByRole("button", { name: "Continue" }));
          node = nodes.find((entry) => entry.id === choice.nextNodeId)!;
        }
        await screen.findByRole("heading", { name: node.text });
        await screen.findByText(node.outcome!.summary);
        await screen.findByRole("heading", { name: "Your path" });
        component.unmount();
      }
    }
  }
}

const output = document.getElementById("component-result")!;
const check =
  new URLSearchParams(window.location.search).get("check") === "quiz"
    ? checkQuiz
    : checkScenarios;
useProgress.getState().reset();
void check().then(
  () => {
    output.textContent = "Passed";
  },
  (error: unknown) => {
    output.textContent = error instanceof Error ? error.message : String(error);
  },
);
