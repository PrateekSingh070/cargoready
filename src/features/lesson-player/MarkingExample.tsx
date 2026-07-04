export function MarkingExample({
  visual,
}: {
  visual: "hazard" | "number" | "arrows";
}) {
  return (
    <svg className="marking-example" viewBox="0 0 104 66" aria-hidden="true">
      {visual === "hazard" && (
        <>
          <path
            d="M52 4 81 33 52 62 23 33Z"
            fill="#ffd2aa"
            stroke="#872f23"
            strokeWidth="2"
          />
          <path
            d="M51 15c7 10 2 11 7 14l2-5c5 8 5 15-1 18-6 4-16 1-17-6-1-5 4-9 5-12 1 5 3 4 4 1 1-3 1-5 0-10Z"
            fill="#872f23"
          />
          <text
            x="52"
            y="55"
            textAnchor="middle"
            fill="#5d2118"
            fontSize="11"
            fontWeight="700"
          >
            3
          </text>
        </>
      )}
      {visual === "number" && (
        <>
          <rect
            x="8"
            y="17"
            width="88"
            height="32"
            rx="5"
            fill="#edf5fb"
            stroke="#416387"
          />
          <text
            x="52"
            y="38"
            textAnchor="middle"
            fill="#193957"
            fontSize="15"
            fontWeight="700"
          >
            UN1263
          </text>
        </>
      )}
      {visual === "arrows" && (
        <>
          <rect
            x="24"
            y="6"
            width="56"
            height="54"
            rx="6"
            fill="#fff1d0"
            stroke="#73510d"
          />
          <path
            d="M38 44V21m-6 7 6-7 6 7m22 16V21m-6 7 6-7 6 7M32 49h40"
            stroke="#56390e"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
