import { makeAutoObservable, runInAction } from "mobx";

import { isBgTaskPollAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { apiCoreStore } from "saltbox-core/store";

export class TemplatePreviewStore {
  slsContent = "";
  loadedTemplateId: string | null = null;
  isLoading = false;
  hasError = false;
  isEmpty = false;

  private loadAbortController: AbortController | null = null;
  private loadGeneration = 0;

  constructor() {
    makeAutoObservable(this);
  }

  private cancelLoad = () => {
    this.loadAbortController?.abort();
    this.loadAbortController = null;
    this.loadGeneration += 1;
  };

  load = async (templateId: string): Promise<boolean> => {
    this.cancelLoad();

    const generation = this.loadGeneration;
    const abortController = new AbortController();
    this.loadAbortController = abortController;
    const isCancelled = () => generation !== this.loadGeneration;

    runInAction(() => {
      this.isLoading = true;
      this.hasError = false;
      this.isEmpty = false;
      this.slsContent = "";
      this.loadedTemplateId = null;
    });

    try {
      const template = await apiCoreStore.newTaskTemplatesApi?.newTemplateRead(
        { template_id: templateId },
        { signal: abortController.signal }
      );

      if (isCancelled()) return false;

      runInAction(() => {
        const content = template?.sls_content;
        if (content == null || content === "") {
          this.isEmpty = true;
          this.slsContent = "";
        } else {
          this.slsContent = content;
        }
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
    this.loadedTemplateId = null;
    this.isEmpty = false;
  };
}
