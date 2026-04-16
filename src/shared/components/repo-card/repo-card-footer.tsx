import { Flex } from "antd";

import { RepoCardStats } from "./repo-card-stats";
import { RepoCardVisibility } from "./repo-card-visibility";

export interface RepoCardFooterProps {
  visibility?: string;
  starCount?: number;
  forkCount?: number;
}

export function RepoCardFooter({ visibility, starCount, forkCount }: RepoCardFooterProps) {
  const hasStats = starCount != null || forkCount != null;
  const hasVisibility = Boolean(visibility);

  if (!hasStats && !hasVisibility) return null;

  return (
    <Flex align="stretch">
      <RepoCardVisibility visibility={visibility} />
      {hasStats && <RepoCardStats starCount={starCount} forkCount={forkCount} />}
    </Flex>
  );
}
