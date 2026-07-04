import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui";
import type { Lesson } from "@/content/schema";
import { MarkingExample } from "@/features/lesson-player/MarkingExample";
import { useProgress } from "@/store/progress";
import { lessonKey, type LessonLocation } from "@/store/progressData";

export function InfoLesson({
  lesson,
  location,
}: {
  lesson: Extract<Lesson, { type: "info" }>;
  location: LessonLocation;
}) {
  const completed = useProgress(
    (state) => state.progress.lessons[lessonKey(location)]?.completed,
  );
  const completeGuide = useProgress((state) => state.completeGuide);
  return (
    <>
      <p className="lesson-intro">{lesson.body}</p>
      {lesson.groups && (
        <dl className="hazard-grid">
          {lesson.groups.map((group) => (
            <div key={group.heading}>
              <dt>{group.heading}</dt>
              {group.visual && (
                <dd>
                  <MarkingExample visual={group.visual} />
                </dd>
              )}
              <dd>{group.examples}</dd>
            </div>
          ))}
        </dl>
      )}
      <aside className="lesson-note">
        <Icon name="info" />
        <p>{lesson.funFact}</p>
      </aside>
      {lesson.source && (
        <a className="text-link" href={lesson.source.url}>
          {lesson.source.label}
        </a>
      )}
      <div className="guide-actions">
        <Button
          variant={completed ? "secondary" : "primary"}
          aria-disabled={completed || undefined}
          onClick={() => {
            if (!completed) completeGuide(location);
          }}
        >
          {completed ? "Field guide completed" : "Mark field guide as read"}
          <Icon name="check" />
        </Button>
      </div>
    </>
  );
}
