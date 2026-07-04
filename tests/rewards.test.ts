import { describe, expect, it } from "vitest";
import fixture from "@/content/air-cargo-basics.json";
import { courseSchema, type CourseModule } from "@/content/schema";
import { getJourney } from "@/features/course/journey";
import { evaluateBadges } from "@/features/gamification/badgeRules";
import {
  levelForXp,
  levelProgress,
  pointsForQuiz,
} from "@/features/gamification/rewardMath";
import {
  activeStreak,
  localDay,
  recordStreak,
} from "@/features/gamification/streak";
import {
  emptyProgress,
  lessonKey,
  totalXp,
  type TrainingProgress,
} from "@/store/progressData";

const course = courseSchema.parse(fixture);
const firstModule = course.modules[0]!;

function complete(
  module: CourseModule,
  progress = emptyProgress,
): TrainingProgress {
  const lessons = { ...progress.lessons };
  module.lessons.forEach((lesson) => {
    lessons[lessonKey({ moduleId: module.id, lessonId: lesson.id })] = {
      completed: true,
      bestCorrect: lesson.type === "quiz" ? lesson.questions.length : undefined,
    };
  });
  return { ...progress, lessons };
}

describe("XP and daily streaks", () => {
  it("gives consecutive answers a capped multiplier and resets the combo after a miss", () => {
    expect(pointsForQuiz([true, true, true])).toBe(38);
    expect(pointsForQuiz([true, true, false, true])).toBe(33);
    expect(pointsForQuiz(Array.from({ length: 8 }, () => true))).toBe(136);
    expect(
      totalXp({
        ...emptyProgress,
        lessons: { "old/quiz": { completed: true, bestCorrect: 3 } },
      }),
    ).toBe(50);
  });

  it("levels up at 100 XP and resets progress toward the next level", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelProgress(100)).toEqual({ earned: 0, required: 100 });
  });

  it("counts local dates across midnight and ignores repeats including a backward clock", () => {
    const before = new Date(2026, 2, 7, 23, 59);
    const after = new Date(2026, 2, 8, 0, 1);
    expect(localDay(after)! - localDay(before)!).toBe(1);
    const first = recordStreak(undefined, before);
    expect(recordStreak(first, new Date(2026, 2, 7, 23, 59, 30))).toBe(first);
    const second = recordStreak(first, after);
    expect(second).toMatchObject({ length: 2, longest: 2 });
    expect(recordStreak(second, before)).toBe(second);
    const third = recordStreak(second, new Date(2026, 2, 9, 10));
    expect(third).toMatchObject({ length: 3, longest: 3 });
    expect(activeStreak(third, new Date(2026, 2, 10, 23))).toBe(3);
    expect(activeStreak(third, new Date(2026, 2, 11))).toBe(0);
    expect(recordStreak(third, new Date(2026, 2, 11))).toMatchObject({
      length: 1,
      longest: 3,
    });
    expect(activeStreak(third, new Date(NaN))).toBe(0);
  });
});

describe("journey and badges", () => {
  it("opens the next module only after every lesson in its prerequisite is complete", () => {
    expect(getJourney(course, emptyProgress).map(({ state }) => state)).toEqual(
      ["open", "locked", "locked", "locked"],
    );
    const progress = complete(firstModule);
    const preview = {
      ...course,
      modules: course.modules.map((module, index) =>
        index === 0 ? module : { ...module, lessons: [] },
      ),
    };
    expect(getJourney(preview, progress).map(({ state }) => state)).toEqual([
      "complete",
      "coming",
      "locked",
      "locked",
    ]);
    expect(getJourney(course, progress).map(({ state }) => state)).toEqual([
      "complete",
      "open",
      "locked",
      "locked",
    ]);
    const downstreamProgress = complete(course.modules[2]!);
    expect(getJourney(course, downstreamProgress)[2]?.state).toBe("locked");
  });

  it("lists eight badges and earns rewards only when their rules match", () => {
    const locked = evaluateBadges(course, emptyProgress);
    expect(locked).toHaveLength(8);
    expect(locked.every((badge) => !badge.earned)).toBe(true);
    const unlocked = evaluateBadges(course, {
      ...complete(firstModule),
      streak: { lastDay: 800, length: 1, longest: 3 },
    })
      .filter((badge) => badge.earned)
      .map((badge) => badge.id);
    expect(unlocked).toEqual([
      "first-flight",
      "cargo-coach",
      "sorted",
      "knowledge-check",
      "perfect-module",
      "on-a-roll",
    ]);
  });
});
