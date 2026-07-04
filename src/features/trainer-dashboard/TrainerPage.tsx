import { lazy, Suspense, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { courseContent } from "@/content/course";
import seedData from "@/content/trainer-demo.json";
import { ContentUnavailable } from "@/features/course/ContentUnavailable";
import {
  filterLearners,
  learnersCsv,
  statusOptions,
  trainerSnapshot,
  validateDemoLearners,
  type LearnerSort,
} from "@/features/trainer-dashboard/analytics";
import { useProfile } from "@/store/profile";
import { useProgress } from "@/store/progress";

const Charts = lazy(() => import("@/features/trainer-dashboard/TrainerCharts"));
const demo = validateDemoLearners(seedData);
type StatusFilter = (typeof statusOptions)[number] | "All";

function LearnersTable({
  rows,
  moduleCount,
}: {
  rows: ReturnType<typeof filterLearners>;
  moduleCount: number;
}) {
  if (!rows.length)
    return <p className="trainer-empty">No learners match your filters.</p>;
  return (
    <div
      className="trainer-table-scroll"
      tabIndex={0}
      role="region"
      aria-label="Learner results"
    >
      <table className="trainer-table">
        <caption className="sr-only">Learner progress and quiz scores</caption>
        <thead>
          <tr>
            {["Learner", "Source", "Status", "Modules", "Avg. quiz score"].map(
              (heading) => (
                <th key={heading} scope="col">
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.name}</th>
              <td>{row.source}</td>
              <td>{row.status}</td>
              <td>
                {row.completed} / {moduleCount}
              </td>
              <td>{row.average === null ? "—" : `${row.average}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function downloadCsv(
  rows: ReturnType<typeof filterLearners>,
  moduleCount: number,
) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", learnersCsv(rows, moduleCount)], {
      type: "text/csv;charset=utf-8;",
    }),
  );
  const download = document.createElement("a");
  download.href = url;
  download.download = "cargoready-learners.csv";
  document.body.append(download);
  download.click();
  download.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function TrainerPage() {
  const progress = useProgress((state) => state.progress);
  const name = useProfile((state) => state.name);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [sort, setSort] = useState<LearnerSort>("name");
  if (!courseContent.success) return <ContentUnavailable />;

  const course = courseContent.data;
  const snapshot = trainerSnapshot(
    course,
    demo.success ? demo.data : [],
    progress,
    name,
  );
  const rows = filterLearners(snapshot.learners, query, status, sort);
  const complete = snapshot.learners.filter(
    (learner) => learner.status === "Complete",
  ).length;
  const inProgress = snapshot.learners.filter(
    (learner) => learner.status === "In progress",
  ).length;
  const totals = [
    ["Learners", snapshot.learners.length],
    ["In progress", inProgress],
    ["Completed course", complete],
  ] as const;

  return (
    <div className="trainer-page">
      <header className="page-heading">
        <Badge>Demo analytics</Badge>
        <h1>Trainer dashboard</h1>
        <p>
          Charts combine simulated learners with your training progress on this
          device.
        </p>
      </header>
      {!demo.success && (
        <p className="notice" role="status">
          Simulated learner data could not be read. Your local progress is
          included.
        </p>
      )}
      <dl className="trainer-totals">
        {totals.map(([label, total]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{total}</dd>
          </div>
        ))}
      </dl>
      <Suspense fallback={<p role="status">Loading charts.</p>}>
        <Charts snapshot={snapshot} />
      </Suspense>
      <Card
        className="trainer-learners"
        aria-labelledby="trainer-learners-title"
      >
        <div className="trainer-section-heading">
          <h2 id="trainer-learners-title">Learners</h2>
          <Button
            variant="secondary"
            disabled={!rows.length}
            onClick={() => downloadCsv(rows, course.modules.length)}
          >
            Export filtered CSV
          </Button>
        </div>
        <div className="trainer-filters">
          <label>
            Search learners{" "}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as StatusFilter)
              }
            >
              <option value="All">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Sort by
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as LearnerSort)}
            >
              <option value="name">Name A to Z</option>
              <option value="progress">Most modules completed</option>
              <option value="score">Highest avg. score</option>
            </select>
          </label>
        </div>
        <p className="trainer-count" role="status">
          {rows.length} of {snapshot.learners.length} learners shown
        </p>
        <LearnersTable rows={rows} moduleCount={course.modules.length} />
      </Card>
    </div>
  );
}
