export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        canvas: "var(--canvas)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
      },
    },
  },
};
