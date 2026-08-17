import { makeAutoObservable, runInAction } from "mobx";

import { isBgTaskPollAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { apiCoreStore } from "saltbox-core/store";

import { formatTemplatePreviewMeta } from "../helpers/format-template-preview-meta";

export type TemplatePreviewTabKey = "meta" | "sls";

export class TemplatePreviewStore {
  slsContent = "";
  metaText = "";
  loadedTemplateId: string | null = null;
  isLoading = false;
  hasError = false;

  private loadAbortController: AbortController | null = null;
  private loadGeneration = 0;

  constructor() {
    makeAutoObservable(this);
  }

  get hasSlsContent(): boolean {
    return this.slsContent.trim() !== "";
  }

  get hasMetaContent(): boolean {
    return this.metaText.trim() !== "";
  }

  get isEmpty(): boolean {
    return !this.hasSlsContent && !this.hasMetaContent;
  }

  get defaultTab(): TemplatePreviewTabKey {
    return this.hasMetaContent ? "meta" : "sls";
  }

  private cancelLoad = () => {
    this.loadAbortController?.abort();
    this.loadAbortController = null;
    this.loadGeneration += 1;
  };

  load = async (sourceId: string, templateId: string): Promise<boolean> => {
    this.cancelLoad();

    const generation = this.loadGeneration;
    const abortController = new AbortController();
    this.loadAbortController = abortController;
    const isCancelled = () => generation !== this.loadGeneration;

    runInAction(() => {
      this.isLoading = true;
      this.hasError = false;
      this.slsContent = "";
      this.metaText = "";
      this.loadedTemplateId = null;
    });

    try {
      const template = await apiCoreStore.taskTemplatesApi?.taskTemplateRead(
        { source_id: sourceId, template_id: templateId },
        { signal: abortController.signal }
      );

      if (isCancelled()) return false;

      runInAction(() => {
        this.slsContent = template?.sls_content ?? "";
        this.metaText = formatTemplatePreviewMeta(template?.meta);
        this.loadedTemplateId = templateId;
        this.isLoading = false;
      });

      return true;
    } catch (error) {
      if (isCancelled() || isBgTaskPollAborted(error)) {
        return false;
      }

      console.error("Failed to load template preview:", error);
      runInAction(() => {
        this.hasError = true;
        this.isLoading = false;
      });

      return true;
    } finally {
      if (generation === this.loadGeneration) {
        this.loadAbortController = null;
      }
    }
  };

  reset = () => {
    this.cancelLoad();
    this.isLoading = false;
    this.hasError = false;
  };

  clearContent = () => {
    this.slsContent = "";
    this.metaText = "";
    this.loadedTemplateId = null;
  };
}
