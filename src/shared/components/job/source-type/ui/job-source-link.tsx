import type { ReactNode } from "react";
import { Link } from "react-router";

interface JobSourceLinkProps {
  to: string;
  children: ReactNode;
}

export function JobSourceLink({ to, children }: JobSourceLinkProps) {
  return (
    <Link
      to={to}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
    >
      {children}
    </Link>
  );
}
