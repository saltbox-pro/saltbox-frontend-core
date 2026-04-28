import type { ReactNode } from "react";
import { Link } from "react-router";

interface JobSourceLinkProps {
  to: string;
  state?: unknown;
  children: ReactNode;
}

export function JobSourceLink({ to, state, children }: JobSourceLinkProps) {
  return (
    <Link
      to={to}
      state={state}
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
