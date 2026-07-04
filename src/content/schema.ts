import { z } from "zod";

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
const illustration = z.enum(["box", "tag", "check", "shield"]);
const source = z
  .object({ label: text, url: z.string().url().startsWith("https://") })
  .optional();
const choice = z.object({
  label: text,
  nextNodeId: id,
  scoreDelta: z.number().int(),
  feedback: text,
  isSafe: z.boolean(),
});
const nodeBase = z.object({ id, text, illustration });
const node = z.union([
  nodeBase.extend({
    choices: z.array(choice).min(2),
    outcome: z.never().optional(),
  }),
  nodeBase.extend({
    choices: z.tuple([]),
    outcome: z.object({
      summary: text,
      whatWentRight: text,
      whatToReview: text,
    }),
  }),
]);

const scenario = z.object({
  id,
  title: text,
  type: z.literal("scenario"),
  intro: text,
  nodes: z.array(node).min(3),
  source,
});

const labeledItem = z.object({ id, label: text });
const dragdrop = z.object({
  id,
  title: text,
  type: z.literal("dragdrop"),
  prompt: text,
  items: z.array(labeledItem).min(2),
  targets: z.array(labeledItem).min(2),
  correctMap: z.record(id, id),
  hintText: text,
});

const quiz = z.object({
  id,
  title: text,
  type: z.literal("quiz"),
  questions: z
    .array(
      z.object({
        id,
        prompt: text,
        options: z.array(text).min(2),
        correctIndex: z.number().int().nonnegative(),
        explanation: text,
        timeLimitSec: z.number().int().positive().optional(),
      }),
    )
    .min(3)
    .max(5),
});

const info = z.object({
  id,
  title: text,
  type: z.literal("info"),
  body: text,
  image: illustration,
  funFact: text,
  groups: z
    .array(
      z.object({
        heading: text,
        examples: text,
        visual: z.enum(["hazard", "number", "arrows"]).optional(),
      }),
    )
    .optional(),
  source,
});

const lessonSchema = z.discriminatedUnion("type", [
  scenario,
  dragdrop,
  quiz,
  info,
]);
export type Lesson = z.infer<typeof lessonSchema>;

const moduleSchema = z.object({
  id,
  title: text,
  summary: text,
  estMinutes: z.number().int().positive(),
  icon: illustration,
  tone: z.enum(["orange", "teal", "yellow", "blue"]),
  lessons: z.array(lessonSchema),
  unlockRule: z.discriminatedUnion("type", [
    z.object({ type: z.literal("open") }),
    z.object({ type: z.literal("complete-module"), moduleId: id }),
  ]),
});

type ReportIssue = (path: (string | number)[], message: string) => void;

function checkUnique(items: { id: string }[], report: ReportIssue) {
  const seen = new Set<string>();
  items.forEach(({ id }, index) => {
    if (seen.has(id)) report([index, "id"], `Duplicate ID: ${id}`);
    seen.add(id);
  });
}

function checkScenario(lesson: z.infer<typeof scenario>, report: ReportIssue) {
  checkUnique(lesson.nodes, (path, message) =>
    report(["nodes", ...path], message),
  );
  const byId = new Map(lesson.nodes.map((node) => [node.id, node]));
  lesson.nodes.forEach((node, index) => {
    node.choices.forEach((choice, choiceIndex) => {
      if (!byId.has(choice.nextNodeId)) {
        report(
          ["nodes", index, "choices", choiceIndex, "nextNodeId"],
          "Choice target does not exist",
        );
      }
    });
  });

  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(nodeId: string) {
    if (visiting.has(nodeId)) {
      report(["nodes"], `Scenario path loops back to ${nodeId}`);
      return;
    }
    if (visited.has(nodeId)) return;
    const node = byId.get(nodeId);
    if (!node) return;
    visiting.add(nodeId);
    node.choices.forEach((choice) => visit(choice.nextNodeId));
    visiting.delete(nodeId);
    visited.add(nodeId);
  }
  const first = lesson.nodes[0];
  if (first) {
    if (first.outcome)
      report(["nodes", 0], "The opening node must offer choices");
    visit(first.id);
  }
  lesson.nodes.forEach((node, index) => {
    if (!visited.has(node.id))
      report(["nodes", index], "Node is unreachable from the opening");
  });
}

function checkLesson(lesson: Lesson, report: ReportIssue) {
  switch (lesson.type) {
    case "scenario":
      checkScenario(lesson, report);
      return;
    case "dragdrop": {
      checkUnique(lesson.items, (path, message) =>
        report(["items", ...path], message),
      );
      checkUnique(lesson.targets, (path, message) =>
        report(["targets", ...path], message),
      );
      const items = new Set(lesson.items.map((item) => item.id));
      const targets = new Set(lesson.targets.map((target) => target.id));
      items.forEach((item) => {
        const target = lesson.correctMap[item];
        if (!target || !targets.has(target))
          report(["correctMap", item], "Item must map to an existing target");
      });
      Object.keys(lesson.correctMap).forEach((item) => {
        if (!items.has(item))
          report(["correctMap", item], "Mapping refers to an unknown item");
      });
      return;
    }
    case "quiz":
      checkUnique(lesson.questions, (path, message) =>
        report(["questions", ...path], message),
      );
      lesson.questions.forEach((question, index) => {
        if (question.correctIndex >= question.options.length) {
          report(
            ["questions", index, "correctIndex"],
            "Answer index is outside the available options",
          );
        }
        if (new Set(question.options).size !== question.options.length) {
          report(
            ["questions", index, "options"],
            "Answer options must be distinct",
          );
        }
      });
      return;
    case "info":
      return;
    default:
      lesson satisfies never;
  }
}

export const courseSchema = z
  .object({
    id,
    title: text,
    description: text,
    modules: z.array(moduleSchema).min(1),
  })
  .superRefine((course, context) => {
    const report: ReportIssue = (path, message) => {
      context.addIssue({ code: "custom", path, message });
    };
    checkUnique(course.modules, (path, message) =>
      report(["modules", ...path], message),
    );
    course.modules.forEach((module, index) => {
      const prefix = ["modules", index];
      const priorModule = course.modules[index - 1];
      const rule = module.unlockRule;
      if (
        priorModule
          ? rule.type !== "complete-module" || rule.moduleId !== priorModule.id
          : rule.type !== "open"
      ) {
        report(
          [...prefix, "unlockRule"],
          "Modules must unlock in course order",
        );
      }
      if (index === 0 && module.lessons.length === 0) {
        report([...prefix, "lessons"], "The first module must contain lessons");
      }
      checkUnique(module.lessons, (path, message) =>
        report([...prefix, "lessons", ...path], message),
      );
      module.lessons.forEach((lesson, lessonIndex) => {
        checkLesson(lesson, (path, message) =>
          report([...prefix, "lessons", lessonIndex, ...path], message),
        );
      });
    });
  });

export type Course = z.infer<typeof courseSchema>;
export type CourseModule = z.infer<typeof moduleSchema>;
