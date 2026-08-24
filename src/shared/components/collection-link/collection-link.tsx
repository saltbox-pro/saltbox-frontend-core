import type { ReactNode } from "react";
import { Link } from "react-router";

type CollectionLinkProps = {
  slug: string | null | undefined;
  children: ReactNode;
};

export function CollectionLink({ slug, children }: CollectionLinkProps) {
  if (!slug) {
    return children;
  }

  return (
    <Link
      to={`/core/minions/${slug}`}
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
