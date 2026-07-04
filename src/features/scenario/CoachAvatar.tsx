export function CoachAvatar({
  mood,
}: {
  mood: "neutral" | "pleased" | "thoughtful";
}) {
  return (
    <svg
      className="coach-avatar"
      viewBox="0 0 88 88"
      fill="none"
      aria-hidden="true"
    >
      <rect width="88" height="88" rx="20" fill="#d9efe9" />
      <path d="M12 88c2-18 12-25 25-27h14c13 2 23 9 25 27" fill="#132d4f" />
      <path d="m24 76 5-7 7 19h-9zM52 88l7-19 5 7-3 12z" fill="#ffbc81" />
      <path d="M38 57h12v10l-6 5-6-5z" fill="#aa684d" />
      <path
        d="M24 34c0-13 8-21 20-21s20 8 20 21v9c0 12-9 20-20 20s-20-8-20-20z"
        fill="#ca8a66"
      />
      <path
        d="M24 38c-5-1-6 3-5 7 1 4 3 5 6 5m39-12c5-1 6 3 5 7-1 4-3 5-6 5"
        fill="#ca8a66"
      />
      <path
        d="M22 36c-1-14 8-25 22-25 11 0 21 6 23 17l-9 5H22z"
        fill="#184964"
      />
      <path
        d="M23 34c9-5 23-7 39-6 5 0 8 3 7 5-2 3-11 2-18 1z"
        fill="#132d4f"
      />
      <path d="m39 19 10-2-5 7-1-3z" fill="#ffd88b" />
      <path
        d={mood === "thoughtful" ? "M31 40l6-2m15 2h5" : "M31 39h6m15 0h5"}
        stroke="#533829"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="35" cy="44" r="1.5" fill="#272d33" />
      <circle cx="54" cy="44" r="1.5" fill="#272d33" />
      <path
        d={
          mood === "pleased"
            ? "M38 50q6 9 13 0"
            : mood === "thoughtful"
              ? "M40 54q4-3 9-1"
              : "M39 51q5 4 10 0"
        }
        stroke="#613829"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
