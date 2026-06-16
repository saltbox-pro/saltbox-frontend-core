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

import { SourceBgTaskPollingService } from "./source-bg-task-polling.service";
import { TemplateSourceActionsService } from "./template-source-actions.service";

export class TemplateSourceRuntime {
  private readonly bgTaskPolling: SourceBgTaskPollingService;
  private readonly sourceActions: TemplateSourceActionsService;

  constructor(private readonly port: TemplateSourceStatePort) {
    this.bgTaskPolling = new SourceBgTaskPollingService({
      isSourcePresent: (sourceId) => this.port.isSourcePresent(sourceId),
      removeSource: (sourceId) => runInAction(() => this.port.removeSource(sourceId)),
      reloadSource: (sourceId) => this.port.reloadSource(sourceId),
    });

    this.sourceActions = new TemplateSourceActionsService(this.bgTaskPolling, {
      setActionState: (sourceId, kind) =>
        runInAction(() => {
          this.port.actionBySourceId.set(sourceId, kind);
        }),
      clearActionState: (sourceId) =>
        runInAction(() => {
          this.port.actionBySourceId.delete(sourceId);
        }),
      patchOptimisticTask: (sourceId, operation, taskId) =>
        runInAction(() => this.port.patchOptimisticTask(sourceId, operation, taskId)),
      removeSource: (sourceId) => runInAction(() => this.port.removeSource(sourceId)),
      isSourcePresent: (sourceId) => this.port.isSourcePresent(sourceId),
    });
  }

  reset = () => {
    this.bgTaskPolling.reset();
    runInAction(() => {
      this.port.actionBySourceId.clear();
    });
  };

  syncForSources = (sources: SourceListWithExtrasSchema[]) => {
    this.bgTaskPolling.syncForSources(sources);
  };

  scheduleForSource = (source: SourceListWithExtrasSchema) => {
    this.bgTaskPolling.scheduleForSource(source);
  };

  plugSource = (sourceId: string): Promise<void> => this.sourceActions.plugSource(sourceId);

  syncSource = (sourceId: string): Promise<void> => this.sourceActions.syncSource(sourceId);

  unplugSource = (sourceId: string): Promise<void> => this.sourceActions.unplugSource(sourceId);

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
        bgTaskPolling: this.bgTaskPolling,
        patchOptimisticTask: (id, operation, taskId) =>
          runInAction(() => this.port.patchOptimisticTask(id, operation, taskId)),
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
