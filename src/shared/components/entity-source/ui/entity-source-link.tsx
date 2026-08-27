import type { ReactNode } from "react";
import { Link } from "react-router";

interface EntitySourceLinkProps {
  to: string;
  state?: unknown;
  children: ReactNode;
}

export function EntitySourceLink({ to, state, children }: EntitySourceLinkProps) {
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
