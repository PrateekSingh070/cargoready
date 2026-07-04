import { describe, expect, it } from "vitest";
import fixture from "@/content/air-cargo-basics.json";
import { loadCourse } from "@/content/course";
import { courseSchema } from "@/content/schema";

describe("training content validation", () => {
  it("loads the four sample lesson types and the sequential module rules", () => {
    const course = courseSchema.parse(fixture);
    expect(course.modules).toHaveLength(4);
    expect(course.modules[0]?.lessons.map((lesson) => lesson.type)).toEqual([
      "info",
      "scenario",
      "dragdrop",
      "quiz",
    ]);
    expect(loadCourse(JSON.stringify(fixture)).success).toBe(true);
  });

  it("reports malformed JSON without breaking the app shell", () => {
    expect(loadCourse("{ definitely not JSON")).toEqual({
      success: false,
      reason: "invalid-json",
    });
  });

  it("rejects broken lesson links, answer keys, mappings and prerequisites", () => {
    const course = courseSchema.parse(fixture);
    const firstModule = course.modules[0]!;
    const [, scenario, matching, quiz] = firstModule.lessons;
    if (
      scenario?.type !== "scenario" ||
      matching?.type !== "dragdrop" ||
      quiz?.type !== "quiz"
    ) {
      throw new Error("Expected a scenario, matching activity and quiz");
    }
    scenario.nodes[0]!.choices[0]!.nextNodeId = "missing-node";
    matching.correctMap["dry-ice"] = "missing-class";
    quiz.questions[0]!.correctIndex = quiz.questions[0]!.options.length;
    course.modules[1]!.unlockRule = {
      type: "complete-module",
      moduleId: "wrong-module",
    };
    const result = courseSchema.safeParse(course);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toEqual(
        expect.arrayContaining([
          "modules.0.lessons.1.nodes.0.choices.0.nextNodeId",
          "modules.0.lessons.2.correctMap.dry-ice",
          "modules.0.lessons.3.questions.0.correctIndex",
          "modules.1.unlockRule",
        ]),
      );
    }
  });

  it("rejects a scenario path that cycles back to its opening", () => {
    const course = courseSchema.parse(fixture);
    const scenario = course.modules[0]?.lessons[1];
    if (scenario?.type !== "scenario")
      throw new Error("Expected a scenario fixture");
    scenario.nodes[0]!.choices[0]!.nextNodeId = scenario.nodes[0]!.id;
    const result = courseSchema.safeParse(course);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("loops back"),
        ),
      ).toBe(true);
    }
  });
});
