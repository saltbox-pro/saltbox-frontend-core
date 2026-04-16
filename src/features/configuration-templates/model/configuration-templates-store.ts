import type {
  GitlabProjectSchema,
  SettingsSlsRepoShortSchema,
} from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

import { ConnectedTemplatesStore } from "./connected-templates-store";

const normalizeRepoUrl = (value: unknown): string | null => {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  return raw
    .replace(/\/+$/, "")
    .replace(/\.git$/i, "")
    .toLowerCase();
};

export class ConfigurationTemplatesStore {
  connectedRepos: SettingsSlsRepoShortSchema[] = [];
  connectedReposIsLoading = false;
  connectedReposError: string | null = null;

  availableProjects: GitlabProjectSchema[] = [];
  availableProjectsIsLoading = false;
  availableProjectsError: string | null = null;

  templatesStore = new ConnectedTemplatesStore();

  constructor() {
    makeAutoObservable(this);
  }

  get isLoading() {
    return this.connectedReposIsLoading || this.availableProjectsIsLoading;
  }

  get hasError() {
    return Boolean(this.connectedReposError || this.availableProjectsError);
  }

  get filteredAvailableProjects() {
    const connectedUrls = new Set<string>();
    for (const repo of this.connectedRepos) {
      const normalized = normalizeRepoUrl(repo.repo_url);
      if (normalized) connectedUrls.add(normalized);
    }

    return this.availableProjects.filter((p) => {
      const normalized = normalizeRepoUrl(p.web_url);
      if (!normalized) return true;
      return !connectedUrls.has(normalized);
    });
  }

  get isEmpty() {
    return this.connectedRepos.length === 0 && this.filteredAvailableProjects.length === 0;
  }

  reset = () => {
    this.connectedRepos = [];
    this.connectedReposIsLoading = false;
    this.connectedReposError = null;

    this.availableProjects = [];
    this.availableProjectsIsLoading = false;
    this.availableProjectsError = null;

    this.templatesStore.reset();
  };

  load = async () => {
    runInAction(() => {
      this.connectedReposIsLoading = true;
      this.connectedReposError = null;
      this.availableProjectsIsLoading = true;
      this.availableProjectsError = null;
    });

    const [reposResult, projectsResult] = await Promise.allSettled([
      apiCoreStore.settingsApi?.repoList({ SettingsSlsRepoListBody: {} }),
      apiCoreStore.gitLabApi?.projectList({}),
    ]);

    runInAction(() => {
      if (reposResult.status === "fulfilled") {
        this.connectedRepos = reposResult.value.data ?? [];
      } else {
        console.error("Failed to load repos:", reposResult.reason);
        this.connectedReposError = "Failed to load repos";
      }
      this.connectedReposIsLoading = false;

      if (projectsResult.status === "fulfilled") {
        this.availableProjects = projectsResult.value.items ?? [];
      } else {
        console.error("Failed to load template sources:", projectsResult.reason);
        this.availableProjectsError = "Failed to load template sources";
      }
      this.availableProjectsIsLoading = false;
    });
  };
}
