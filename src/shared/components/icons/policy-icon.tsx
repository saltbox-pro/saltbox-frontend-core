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
        <rect x="75" y="73" width="50" height="50" rx="16" ry="16" fill="#fff" strokeOpacity="0" />
        <path
          d="M100,98 C93,82 77,82 77,98 C77,114 93,114 100,98 C107,82 123,82 123,98 C123,114 107,114 100,98"
          strokeWidth="6"
        />
      </g>
    </svg>
  );
}
