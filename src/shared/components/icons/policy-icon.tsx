type PolicyIconProps = {
  size?: number | string;
};

export function PolicyIcon({ size = "1em" }: PolicyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="15.5 14.5 107 107"
      overflow="visible"
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
        <path d="M110,76 L110,28 A8,8 0 0 0 102,20 L36,20 A8,8 0 0 0 28,28 L28,108 A8,8 0 0 0 36,116 L75,116" />
        <line x1="43" y1="50" x2="95" y2="50" />
        <line x1="43" y1="70" x2="95" y2="70" />
        <line x1="43" y1="90" x2="72" y2="90" />
        <path
          d="M100,98 C93,82 77,82 77,98 C77,114 93,114 100,98 C107,82 123,82 123,98 C123,114 107,114 100,98"
          strokeWidth="6"
        />
      </g>
    </svg>
  );
}
