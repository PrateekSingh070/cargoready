import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui";
import type { TrainerSnapshot } from "@/features/trainer-dashboard/analytics";

function ChartCard({
  title,
  children,
  entries,
}: {
  title: string;
  children: ReactNode;
  entries: { label: string; value: string }[];
}) {
  return (
    <Card className="trainer-chart">
      <h2>{title}</h2>
      {entries.length ? (
        <>
          <div className="chart-plot">{children}</div>
          <details>
            <summary>View chart values</summary>
            <dl className="chart-values">
              {entries.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </details>
        </>
      ) : (
        <p className="trainer-empty">No results to display yet.</p>
      )}
    </Card>
  );
}

const axisStyle = { fill: "var(--muted)", fontSize: 12 };
const tipStyle = {
  background: "var(--surface)",
  color: "var(--ink)",
  borderColor: "var(--line)",
  borderRadius: ".5rem",
};
const percent = (value: number | string) => `${value}%`;

export default function TrainerCharts({
  snapshot,
}: {
  snapshot: TrainerSnapshot;
}) {
  const { modules, mostMissed, trend } = snapshot;
  return (
    <div className="trainer-charts">
      <ChartCard
        title="Completion by module"
        entries={modules.map((module) => ({
          label: module.title,
          value: percent(module.completion),
        }))}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={modules} accessibilityLayer>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} />
            <YAxis
              domain={[0, 100]}
              tick={axisStyle}
              tickFormatter={percent}
              width={48}
            />
            <Tooltip
              contentStyle={tipStyle}
              labelStyle={tipStyle}
              itemStyle={{ color: "var(--ink)" }}
              formatter={(value) => [percent(String(value)), "Completed"]}
            />
            <Bar
              dataKey="completion"
              fill="var(--teal)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard
        title="Average quiz score by module"
        entries={modules
          .filter(({ score }) => score !== null)
          .map((module) => ({
            label: module.title,
            value: percent(module.score ?? 0),
          }))}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={modules} accessibilityLayer>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} />
            <YAxis
              domain={[0, 100]}
              tick={axisStyle}
              tickFormatter={percent}
              width={48}
            />
            <Tooltip
              contentStyle={tipStyle}
              itemStyle={{ color: "var(--ink)" }}
              formatter={(value) => [percent(String(value)), "Average score"]}
            />
            <Bar
              dataKey="score"
              fill="var(--chart-secondary)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard
        title="Most-missed questions"
        entries={mostMissed.map(({ label, prompt, module, count }) => ({
          label: `${label} ${prompt} · ${module}`,
          value: `${count} ${count === 1 ? "miss" : "misses"}`,
        }))}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mostMissed} layout="vertical" accessibilityLayer>
            <CartesianGrid stroke="var(--line)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={axisStyle} />
            <YAxis
              dataKey="label"
              type="category"
              tick={axisStyle}
              width={38}
            />
            <Tooltip
              contentStyle={tipStyle}
              itemStyle={{ color: "var(--ink)" }}
              labelFormatter={(label) =>
                mostMissed.find((entry) => entry.label === label)?.prompt ??
                label
              }
              formatter={(value) => [String(value), "Misses"]}
            />
            <Bar
              dataKey="count"
              fill="var(--chart-secondary)"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard
        title="Score trend by day (UTC)"
        entries={trend.map(({ day, score, attempts }) => ({
          label: day,
          value: `${percent(score)} · ${attempts} ${attempts === 1 ? "attempt" : "attempts"}`,
        }))}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} accessibilityLayer>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={axisStyle}
              tickFormatter={(day: string) => day.slice(5)}
              minTickGap={16}
            />
            <YAxis
              domain={[0, 100]}
              tick={axisStyle}
              tickFormatter={percent}
              width={48}
            />
            <Tooltip
              contentStyle={tipStyle}
              itemStyle={{ color: "var(--ink)" }}
              formatter={(value) => [percent(String(value)), "Average score"]}
            />
            <Line
              type="linear"
              dataKey="score"
              stroke="var(--teal)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
