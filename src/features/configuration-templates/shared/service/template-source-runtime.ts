import type { SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";
import { runInAction } from "mobx";

import { canAddSourceFiles } from "../../files/helpers/can-add-source-files";
import { addSourceFileWithPolling } from "../../files/service/add-source-file.service";
import {
  deleteSourceFileApi,
  uploadSourceFile,
} from "../../files/service/source-file-mutations.service";
import type { AddSourceFilePayload } from "../../files/types/source-file-payload";
import type { ResourceDeleteResult } from "../types/resource-delete-result";
import type { TemplateSourceStatePort } from "../types/template-source-state-port";

import { SourcePollingService } from "./source-polling.service";
import { TemplateSourceActionsService } from "./template-source-actions.service";

export class TemplateSourceRuntime {
  private readonly sourcePolling: SourcePollingService;
  private readonly sourceActions: TemplateSourceActionsService;

  constructor(private readonly port: TemplateSourceStatePort) {
    this.sourcePolling = new SourcePollingService({
      refreshSource: (sourceId) => this.port.refreshSource(sourceId),
      applySourceUpdate: (updated) => runInAction(() => this.port.applySourceUpdate(updated)),
      isSourcePresent: (sourceId) => this.port.isSourcePresent(sourceId),
    });

    this.sourceActions = new TemplateSourceActionsService(this.sourcePolling, {
      setActionState: (sourceId, kind) =>
        runInAction(() => {
          this.port.actionBySourceId.set(sourceId, kind);
        }),
      clearActionState: (sourceId) =>
        runInAction(() => {
          this.port.actionBySourceId.delete(sourceId);
        }),
      markOptimisticOperation: (sourceId, operation) =>
        runInAction(() => this.port.patchOptimisticOperation(sourceId, operation)),
      removeSource: (sourceId) => runInAction(() => this.port.removeSource(sourceId)),
    });
  }

  reset = () => {
    this.sourcePolling.reset();
    runInAction(() => {
      this.port.actionBySourceId.clear();
    });
  };

  syncForSources = (sources: SourceListWithExtrasSchema[]) => {
    this.sourcePolling.syncForSources(sources);
  };

  scheduleForSource = (source: SourceListWithExtrasSchema) => {
    this.sourcePolling.scheduleForSource(source);
  };

  plugSource = (sourceId: string): Promise<void> => this.sourceActions.plugSource(sourceId);

  syncSource = (sourceId: string): Promise<void> => this.sourceActions.syncSource(sourceId);

  deleteSource = (sourceId: string): Promise<ResourceDeleteResult> =>
    this.sourceActions.deleteSource(sourceId);

  addSourceFile = (sourceId: string, payload: AddSourceFilePayload): Promise<void> => {
    const source = this.port.getSource(sourceId);

    if (!source || !canAddSourceFiles(source, this.port)) {
      throw new Error("Cannot add file while source operation is in progress");
    }

    return addSourceFileWithPolling(
      {
        uploadFile: (id, filePayload) => uploadSourceFile(id, filePayload),
        polling: this.sourcePolling,
        markOptimisticOperation: (id, operation) =>
          runInAction(() => this.port.patchOptimisticOperation(id, operation)),
        setActionState: (id) =>
          runInAction(() => {
            this.port.actionBySourceId.set(id, "add_file");
          }),
        clearActionState: (id) =>
          runInAction(() => {
            this.port.actionBySourceId.delete(id);
          }),
        onComplete: () => this.port.reloadSource(sourceId),
      },
      sourceId,
      payload
    );
  };

  deleteSourceFile = async (sourceId: string, fileId: string): Promise<ResourceDeleteResult> => {
    const result = await deleteSourceFileApi(sourceId, fileId);
    await this.port.reloadSource(sourceId);
    return result;
  };
}
