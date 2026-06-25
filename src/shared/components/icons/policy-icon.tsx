type PolicyIconProps = {
  size?: number;
};

export function PolicyIcon({ size = 20 }: PolicyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="26 18 101 107"
      width={size}
      height={size}
      role="img"
      aria-label="policy-icon"
    >
      <g fill="none" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="28" y="20" width="82" height="96" rx="8" ry="8" />
        <line x1="43" y1="50" x2="95" y2="50" />
        <line x1="43" y1="70" x2="95" y2="70" />
        <line x1="43" y1="90" x2="95" y2="90" />
        <rect x="75" y="73" width="50" height="50" rx="15" ry="15" fill="#fff" />
        <path
          d="M100,98 C92,84 80,84 80,98 C80,112 92,112 100,98 C108,112 120,112 120,98 C120,84 108,84 100,98"
          strokeWidth="6"
        />
      </g>
    </svg>
  );
}
