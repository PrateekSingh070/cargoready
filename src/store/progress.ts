import { create } from "zustand";
import { recordStreak } from "@/features/gamification/streak";
import { levelForXp } from "@/features/gamification/rewardMath";
import { playRewardSound } from "@/features/gamification/sound";
import { useSettings } from "@/store/settings";
import {
  emptySortingRun,
  isSortingRunCurrent,
  type SortingLesson,
  type SortingRun,
} from "@/features/dragdrop/sortingLogic";
import {
  type Attempt,
  type Quiz,
  isCompatibleAttempt,
} from "@/features/quiz/quizLogic";
import {
  openingRun,
  readScenarioRun,
  type Scenario,
  type ScenarioRun,
} from "@/features/scenario/scenarioLogic";
import {
  emptyProgress,
  lessonKey,
  readProgress,
  removeProgress,
  saveQuizAttempt,
  saveScenarioRun,
  saveSortingRun,
  totalXp,
  writeProgress,
  type LessonLocation,
  type TrainingProgress,
} from "@/store/progressData";
import { browserStorage } from "@/store/storage";

type ProgressStore = {
  progress: TrainingProgress;
  visit: (location: LessonLocation) => void;
  completeGuide: (location: LessonLocation) => void;
  updateQuiz: (
    location: LessonLocation,
    quiz: Quiz,
    update: (attempt?: Attempt) => Attempt | undefined,
  ) => void;
  updateScenario: (
    location: LessonLocation,
    scenario: Scenario,
    update: (run: ScenarioRun) => ScenarioRun,
  ) => void;
  updateSorting: (
    location: LessonLocation,
    lesson: SortingLesson,
    update: (run: SortingRun) => SortingRun,
  ) => void;
  reset: () => void;
};

export const useProgress = create<ProgressStore>((set) => {
  function commit(update: (progress: TrainingProgress) => TrainingProgress) {
    set((state) => {
      const updated = update(state.progress);
      if (updated === state.progress) return state;
      const progress = {
        ...updated,
        streak: recordStreak(updated.streak, new Date()),
      };
      writeProgress(browserStorage, progress);
      if (useSettings.getState().preferences.sound) {
        const before = totalXp(state.progress);
        const after = totalXp(progress);
        if (after > before)
          void playRewardSound(levelForXp(after) > levelForXp(before));
      }
      return { progress };
    });
  }

  return {
    progress: readProgress(browserStorage),
    visit: (location) =>
      commit((progress) => {
        const streak = recordStreak(progress.streak, new Date());
        if (
          progress.lastLesson &&
          lessonKey(progress.lastLesson) === lessonKey(location) &&
          streak === progress.streak
        )
          return progress;
        return { ...progress, lastLesson: location, streak };
      }),
    completeGuide: (location) =>
      commit((progress) => {
        const key = lessonKey(location);
        if (progress.lessons[key]?.completed) return progress;
        return {
          ...progress,
          lessons: { ...progress.lessons, [key]: { completed: true } },
        };
      }),
    updateQuiz: (location, quiz, update) =>
      commit((progress) => {
        const key = lessonKey(location);
        const entry = progress.lessons[key];
        const saved = entry?.attempt;
        const attempt = update(
          saved && isCompatibleAttempt(quiz, saved) ? saved : undefined,
        );
        if (!attempt || attempt === saved) return progress;

        return saveQuizAttempt(progress, key, quiz, attempt);
      }),
    updateScenario: (location, scenario, update) =>
      commit((progress) => {
        const key = lessonKey(location);
        const saved = progress.lessons[key]?.scenarioRun;
        const current =
          saved && readScenarioRun(scenario, saved) ? saved : openingRun;
        const next = update(current);
        return next === current
          ? progress
          : saveScenarioRun(progress, key, scenario, next);
      }),
    updateSorting: (location, lesson, update) =>
      commit((progress) => {
        const key = lessonKey(location);
        const saved = progress.lessons[key]?.sortingRun;
        const run =
          saved && isSortingRunCurrent(lesson, saved) ? saved : emptySortingRun;
        const next = update(run);
        return next === run
          ? progress
          : saveSortingRun(progress, key, lesson, next);
      }),
    reset() {
      removeProgress(browserStorage);
      set({ progress: emptyProgress });
    },
  };
});
