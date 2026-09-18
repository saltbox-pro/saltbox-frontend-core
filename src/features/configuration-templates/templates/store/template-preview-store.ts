import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

import { formatTemplatePreviewMeta } from "../helpers/format-template-preview-meta";

export type TemplatePreviewTabKey = "meta" | "sls";

export class TemplatePreviewStore {
  slsContent = "";
  metaText = "";
  loadedTemplateId: string | null = null;

  private loadAbortController: AbortController | null = null;

  readonly previewLoad = createLoader({
    run: (sourceId: string, templateId: string, signal: AbortSignal) =>
      apiCoreStore.taskTemplatesApi?.taskTemplateRead(
        { source_id: sourceId, template_id: templateId },
        { signal }
      ),
    onSuccess: (template, _sourceId, templateId) => {
      this.slsContent = template?.sls_content ?? "";
      this.metaText = formatTemplatePreviewMeta(template?.meta);
      this.loadedTemplateId = templateId;
    },
  });

  constructor() {
    makeAutoObservable(this, { previewLoad: false });
  }

  get isLoading(): boolean {
    return this.previewLoad.isLoading;
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
  };

  load = async (sourceId: string, templateId: string): Promise<boolean> => {
    this.cancelLoad();

    const abortController = new AbortController();
    this.loadAbortController = abortController;

    runInAction(() => {
      this.slsContent = "";
      this.metaText = "";
      this.loadedTemplateId = null;
    });

    await this.previewLoad.run(sourceId, templateId, abortController.signal);

    if (this.loadAbortController === abortController) {
      this.loadAbortController = null;
    }

    return !abortController.signal.aborted;
  };

  reset = () => {
    this.cancelLoad();
  };

  clearContent = () => {
    this.slsContent = "";
    this.metaText = "";
    this.loadedTemplateId = null;
  };
}
