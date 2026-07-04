import { lazy, Suspense, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Badge, ButtonLink, Card, ProgressBar } from "@/components/ui";
import { courseContent, lessonPath } from "@/content/course";
import type { CourseModule, Lesson } from "@/content/schema";
import { ContentUnavailable } from "@/features/course/ContentUnavailable";
import { getJourney } from "@/features/course/journey";
import { useTrainingStreak } from "@/features/gamification/useTrainingStreak";
import { InfoLesson } from "@/features/lesson-player/InfoLesson";
import { QuizLesson } from "@/features/quiz/QuizLesson";
import { ScenarioLesson } from "@/features/scenario/ScenarioLesson";
import { useProgress } from "@/store/progress";
import { totalXp, type LessonLocation } from "@/store/progressData";

const lessonLabels: Record<Lesson["type"], string> = {
  info: "Field guide",
  scenario: "Scenario",
  dragdrop: "Sorting activity",
  quiz: "Knowledge check",
};
const SortingActivity = lazy(
  () => import("@/features/dragdrop/SortingActivity"),
);

function LessonActivity({
  lesson,
  location,
}: {
  lesson: Lesson;
  location: LessonLocation;
}) {
  switch (lesson.type) {
    case "info":
      return <InfoLesson lesson={lesson} location={location} />;
    case "scenario":
      return <ScenarioLesson scenario={lesson} location={location} />;
    case "dragdrop":
      return (
        <Suspense fallback={<p role="status">Loading sorting activity.</p>}>
          <SortingActivity lesson={lesson} location={location} />
        </Suspense>
      );
    case "quiz":
      return <QuizLesson quiz={lesson} location={location} />;
    default:
      return lesson satisfies never;
  }
}

export default function LessonPage() {
  const { moduleId, lessonId } = useParams<"moduleId" | "lessonId">();
  const progress = useProgress((state) => state.progress);
  if (!courseContent.success) return <ContentUnavailable />;

  const entry = getJourney(courseContent.data, progress).find(
    (entry) => entry.module.id === moduleId,
  );
  const module = entry?.module;
  const position =
    module?.lessons.findIndex((entry) => entry.id === lessonId) ?? -1;
  const lesson = module?.lessons[position];
  if (
    !module ||
    !lesson ||
    (entry?.state !== "open" && entry?.state !== "complete")
  ) {
    return (
      <section className="page-heading inner-page">
        <h1>Lesson unavailable</h1>
        <p>Choose an available lesson from the course outline.</p>
        <ButtonLink to="/course">
          Back to course <Icon name="arrow" />
        </ButtonLink>
      </section>
    );
  }

  return <LessonPlayer module={module} lesson={lesson} position={position} />;
}

function LessonPlayer({
  module,
  lesson,
  position,
}: {
  module: CourseModule;
  lesson: Lesson;
  position: number;
}) {
  const moduleId = module.id;
  const lessonId = lesson.id;
  const visit = useProgress((state) => state.visit);
  const xp = useProgress((state) => totalXp(state.progress));
  const streak = useTrainingStreak();
  useEffect(() => {
    visit({ moduleId, lessonId });
  }, [visit, moduleId, lessonId]);

  const previousLesson = module.lessons[position - 1];
  const nextLesson = module.lessons[position + 1];

  return (
    <div className="inner-page lesson-page">
      <div className="lesson-toolbar">
        <Link className="text-link lesson-exit" to="/course">
          <Icon name="close" /> Exit to course
        </Link>
        <div className="lesson-metrics">
          <Badge>{xp} XP</Badge>
          <Badge>{streak}-day streak</Badge>
        </div>
      </div>
      <div className="lesson-position">
        <p>
          {module.title} · Lesson {position + 1} of {module.lessons.length}
        </p>
        <ProgressBar
          label="Lesson position in module"
          value={position + 1}
          max={module.lessons.length}
        />
      </div>
      <Card
        key={lesson.id}
        className="lesson-card"
        aria-labelledby="lesson-title"
      >
        <div className="lesson-labels">
          {lesson.type === "info" && (
            <span className={`module-icon module-icon--${module.tone}`}>
              <Icon name={lesson.image} />
            </span>
          )}
          <Badge>{lessonLabels[lesson.type]}</Badge>
        </div>
        <h1 id="lesson-title">{lesson.title}</h1>
        <LessonActivity lesson={lesson} location={{ moduleId, lessonId }} />
      </Card>
      <nav className="lesson-navigation" aria-label="Lesson navigation">
        {previousLesson && (
          <ButtonLink
            variant="secondary"
            to={lessonPath(module.id, previousLesson.id)}
          >
            <span className="back-arrow">
              <Icon name="arrow" />
            </span>{" "}
            Previous lesson
          </ButtonLink>
        )}
        {nextLesson ? (
          <ButtonLink to={lessonPath(module.id, nextLesson.id)}>
            Next lesson <Icon name="arrow" />
          </ButtonLink>
        ) : (
          <ButtonLink to="/course">
            Back to course <Icon name="arrow" />
          </ButtonLink>
        )}
      </nav>
    </div>
  );
}
