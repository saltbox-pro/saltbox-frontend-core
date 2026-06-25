type TaskIconProps = {
  size?: number;
};

export function TaskIcon({ size = 20 }: TaskIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="26 18 101 107"
      width={size}
      height={size}
      role="img"
      aria-label="task-icon"
    >
      <g fill="none" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="28" y="20" width="82" height="96" rx="8" ry="8" />
        <line x1="43" y1="50" x2="95" y2="50" />
        <line x1="43" y1="70" x2="95" y2="70" />
        <line x1="43" y1="90" x2="95" y2="90" />
        <rect x="75" y="73" width="50" height="50" rx="15" ry="15" fill="#fff" />
        <path d="M91,88 l9,-6" strokeWidth="6" />
        <line x1="100" y1="82" x2="100" y2="108" strokeWidth="6" />
        <line x1="88" y1="110" x2="110" y2="110" strokeWidth="6" />
      </g>
    </svg>
  );
}
