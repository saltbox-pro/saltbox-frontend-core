type AddTaskIconProps = {
  size?: number;
  badgeColor?: string;
};

export function AddTaskIcon({ size = 20, badgeColor = "#fff" }: AddTaskIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="26 18 101 107"
      width={size}
      height={size}
      role="img"
      aria-label="add-icon"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="28" y="20" width="82" height="96" rx="8" ry="8" />
        <line x1="43" y1="50" x2="95" y2="50" />
        <line x1="43" y1="70" x2="95" y2="70" />
        <line x1="43" y1="90" x2="95" y2="90" />
        <circle cx="101" cy="99" r="22" style={{ fill: badgeColor }} strokeOpacity="0" />
        <line x1="101" y1="87" x2="101" y2="111" strokeWidth="6.5" />
        <line x1="89" y1="99" x2="113" y2="99" strokeWidth="6.5" />
      </g>
    </svg>
  );
}
