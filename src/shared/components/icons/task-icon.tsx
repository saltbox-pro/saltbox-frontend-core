type TaskIconProps = {
  size?: number | string;
};

export function TaskIcon({ size = "1em" }: TaskIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="15.5 14.5 107 107"
      width={size}
      height={size}
      role="img"
      aria-label="task-icon"
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
      </g>
    </svg>
  );
}
