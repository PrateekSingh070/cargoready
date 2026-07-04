import { motion, useReducedMotion } from "framer-motion";
import { useSettings } from "@/store/settings";

export function CargoPlane() {
  const systemReducedMotion = useReducedMotion();
  const reducedMotion = useSettings((state) => state.preferences.reducedMotion);
  const stationary = reducedMotion || systemReducedMotion;

  return (
    <svg
      className="hero-art"
      viewBox="0 0 560 350"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="flight-grid"
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <path d="M28 0H0V28" stroke="#a3c8f4" strokeOpacity=".12" />
        </pattern>
        <linearGradient
          id="flight-sky"
          x1="95"
          y1="350"
          x2="480"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#16335b" />
          <stop offset="1" stopColor="#234b76" />
        </linearGradient>
      </defs>
      <path fill="url(#flight-sky)" d="M0 0h560v350H0z" />
      <path fill="url(#flight-grid)" d="M0 0h560v350H0z" />
      <circle
        cx="348"
        cy="151"
        r="93"
        fill="#284f79"
        stroke="#779dc4"
        strokeOpacity=".55"
      />
      <circle
        cx="348"
        cy="151"
        r="112"
        stroke="#779dc4"
        strokeOpacity=".45"
        strokeDasharray="3 7"
      />
      <path
        d="M-20 266C41 224 88 272 154 248S234 180 342 214 475 259 581 156"
        stroke="#9cc7e5"
        strokeOpacity=".7"
        strokeWidth="2"
        strokeDasharray="6 8"
      />
      <path
        d="M68 90h65m-48 9h31m305 177h88m-61 9h31M468 66h48"
        stroke="#9cc7e5"
        strokeOpacity=".4"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M496 102v16m-8-8h16M105 197v12m-6-6h12M182 60v14m-7-7h14"
        stroke="#ffd778"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="69" cy="251" r="5" fill="#ffd778" />
      <circle cx="509" cy="217" r="4" fill="#81dfcd" />
      <motion.g
        initial={false}
        animate={{ y: stationary ? 0 : [0, -5, 0] }}
        transition={
          stationary
            ? { duration: 0 }
            : { duration: 0.38, repeat: 1, ease: "easeInOut" }
        }
      >
        <g transform="rotate(-13 308 167)">
          <path d="M222 152l34-60c3-5 7-7 13-7h17l-11 69" fill="#9cc8dc" />
          <path d="M130 155l-23-49h17l63 54" fill="#ffad69" />
          <path
            d="M131 151h287c33 0 65 15 73 23-12 18-45 22-77 22H171c-25 0-41-12-55-26-8-8-6-19 15-19Z"
            fill="#edf7fd"
          />
          <path
            d="M128 178h357c-15 14-42 18-73 18H172c-18 0-33-7-44-18Z"
            fill="#a8d1e3"
          />
          <path d="M430 155c16 3 25 7 39 14h-40l-10-14h11Z" fill="#193957" />
          <rect x="176" y="158" width="9" height="9" rx="3" fill="#577d9c" />
          <rect x="192" y="158" width="9" height="9" rx="3" fill="#577d9c" />
          <rect x="208" y="158" width="9" height="9" rx="3" fill="#577d9c" />
          <path
            d="M292 176l-79 70h28l107-63c5-3 4-7-3-7h-53Z"
            fill="#74cbbd"
            stroke="#163c58"
            strokeWidth="2"
          />
          <rect
            x="314"
            y="187"
            width="43"
            height="17"
            rx="8"
            fill="#ffb373"
            stroke="#163c58"
            strokeWidth="2"
          />
          <path
            d="M373 161h25"
            stroke="#e68242"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      </motion.g>
      <g transform="translate(390 270)">
        <path
          d="M0 19 34 3l34 16v36L34 72 0 55V19Z"
          fill="#ffc187"
          stroke="#173352"
          strokeWidth="2"
        />
        <path
          d="M0 19 34 36l34-17M34 36v36M16 11l34 17v14"
          stroke="#8d502e"
          strokeWidth="2"
        />
        <path d="m8 41 15 7v9l-15-7z" fill="#fff0d5" />
      </g>
      <g transform="translate(462 292) scale(.67)">
        <path
          d="M0 19 34 3l34 16v36L34 72 0 55V19Z"
          fill="#83dbcc"
          stroke="#173352"
          strokeWidth="2"
        />
        <path
          d="M0 19 34 36l34-17M34 36v36M16 11l34 17v14"
          stroke="#315d61"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}
