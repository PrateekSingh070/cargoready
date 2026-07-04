import { Icon } from "@/components/Icon";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { courseContent, lessonPath } from "@/content/course";
import { ContentUnavailable } from "@/features/course/ContentUnavailable";
import { getJourney } from "@/features/course/journey";
import { RewardsPanel } from "@/features/gamification/RewardsPanel";
import { useProgress } from "@/store/progress";

export default function CoursePage() {
  const progress = useProgress((state) => state.progress);
  if (!courseContent.success) return <ContentUnavailable />;
  const course = courseContent.data;
  const journey = getJourney(course, progress);

  return (
    <div className="inner-page">
      <header className="page-heading">
        <h1>{course.title}</h1>
        <p>{course.description}</p>
      </header>
      <h2 className="journey-title">Your training journey</h2>
      <ol className="journey">
        {journey.map(({ module, state, completed, nextLesson }, index) => {
          const firstLesson = module.lessons[0];
          const available =
            (state === "open" || state === "complete") && firstLesson;
          const saved = progress.lastLesson;
          const resume =
            state !== "complete" &&
            saved?.moduleId === module.id &&
            module.lessons.find((lesson) => lesson.id === saved.lessonId);
          const previousModule = journey[index - 1]?.module;
          const even = index % 2 === 0;
          const path = even
            ? "M25 0 C25 50 55 50 55 100"
            : "M55 0 C55 50 25 50 25 100";
          return (
            <li
              key={module.id}
              className="journey-stop"
              data-state={state}
              data-side={even ? "left" : "right"}
            >
              <div className="journey-track" aria-hidden="true">
                {index < journey.length - 1 && (
                  <svg viewBox="0 0 80 100" preserveAspectRatio="none">
                    <path className="journey-path" d={path} />
                    <path
                      className="journey-path journey-path--earned"
                      pathLength="1"
                      d={path}
                    />
                  </svg>
                )}
                <span className="journey-node">
                  <Icon
                    name={
                      state === "complete"
                        ? "check"
                        : state === "locked"
                          ? "lock"
                          : "plane"
                    }
                  />
                </span>
              </div>
              <Card className="outline-card">
                <span className={`module-icon module-icon--${module.tone}`}>
                  <Icon name={module.icon} />
                </span>
                <div className="outline-details">
                  <p>
                    Module {index + 1} · {module.estMinutes} min
                  </p>
                  <h3>{module.title}</h3>
                  <p>{module.summary}</p>
                  {available ? (
                    <>
                      <p>
                        {state === "complete"
                          ? "Module completed"
                          : `${completed} of ${module.lessons.length} lessons completed`}
                      </p>
                      <div className="course-actions">
                        <ButtonLink
                          to={lessonPath(
                            module.id,
                            resume ? resume.id : (nextLesson ?? available).id,
                          )}
                        >
                          {state === "complete"
                            ? "Review module"
                            : resume
                              ? "Resume training"
                              : completed
                                ? "Continue module"
                                : `Open Module ${index + 1}`}{" "}
                          <Icon name="arrow" />
                        </ButtonLink>
                        {resume && resume.id !== available.id && (
                          <ButtonLink
                            variant="secondary"
                            to={lessonPath(module.id, available.id)}
                          >
                            Review from the start
                          </ButtonLink>
                        )}
                      </div>
                    </>
                  ) : (
                    <Badge>
                      {state === "coming" ? (
                        "Unlocked · lessons coming soon"
                      ) : (
                        <>
                          <Icon name="lock" />{" "}
                          {previousModule
                            ? `Complete ${previousModule.title} first`
                            : "Locked"}
                        </>
                      )}
                    </Badge>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
      <RewardsPanel course={course} progress={progress} />
    </div>
  );
}
