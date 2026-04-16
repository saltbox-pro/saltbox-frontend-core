import type { GitlabProjectSchema } from "@saltbox/saltbox-core-api-client";

import { RepoCard } from "saltbox-core/shared/components/repo-card";

export interface DisconnectedRepoCardProps {
  project: GitlabProjectSchema;
}

export function DisconnectedRepoCard({ project }: DisconnectedRepoCardProps) {
  return (
    <RepoCard
      isConnected={false}
      name={project.name}
      description={project.description}
      webUrl={project.web_url}
      createdAt={project.created_at}
      updatedAt={project.updated_at}
      visibility={project.visibility}
      starCount={project.star_count}
      forkCount={project.forks_count}
    />
  );
}
