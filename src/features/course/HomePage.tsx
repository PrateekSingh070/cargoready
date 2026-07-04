import { Icon } from "@/components/Icon";
import { Badge, Card } from "@/components/ui";
import { CargoPlane } from "@/features/course/CargoPlane";
import { StartTraining } from "@/features/course/StartTraining";
import { courseContent } from "@/content/course";
import { ContentUnavailable } from "@/features/course/ContentUnavailable";

export default function HomePage() {
  if (!courseContent.success) return <ContentUnavailable />;
  const course = courseContent.data;
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <Badge>
            <Icon name="plane" /> Air cargo training
          </Badge>
          <h1 id="hero-title">{course.title}</h1>
          <p>{course.description}</p>
          <StartTraining />
        </div>
        <CargoPlane />
      </section>
      <section className="overview" aria-labelledby="overview-title">
        <h2 id="overview-title">What you’ll learn</h2>
        <ol className="module-grid">
          {course.modules.map((module) => (
            <li key={module.id}>
              <Card className="module-card">
                <span className={`module-icon module-icon--${module.tone}`}>
                  <Icon name={module.icon} />
                </span>
                <h3>{module.title}</h3>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
