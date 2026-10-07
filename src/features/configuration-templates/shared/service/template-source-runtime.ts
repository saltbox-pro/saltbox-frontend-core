import type { SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";
import { runInAction } from "mobx";

import {
  requestContentUpdateApply,
  requestContentUpdateCheck,
} from "../../content-update/service/content-update.service";
import type {
  ContentUpdateApplyRequest,
  ContentUpdateApplyResult,
  ContentUpdateCheckRequest,
  ContentUpdateCheckResult,
} from "../../content-update/types/content-update";
import { canAddSourceFiles, canDeleteSourceFiles } from "../../files/helpers/can-add-source-files";
import {
  deleteSourceFileApi,
  uploadSourceFile,
} from "../../files/service/source-file-mutations.service";
import type { AddSourceFilePayload } from "../../files/types/source-file-payload";
import { canDeleteSourceTemplates } from "../../templates/helpers/can-manage-source-templates";
import { deleteSourceTemplateWithPolling } from "../../templates/service/delete-source-template.service";
import { getSourceActionContext } from "../helpers/source-action-progress";
import type { ResourceDeleteResult } from "../types/resource-delete-result";
import type { TemplateSourceStatePort } from "../types/template-source-state-port";
import type { UpdateTemplateSourcePayload } from "../types/update-template-source";

import { SourceBgTaskPollingService } from "./source-bg-task-polling.service";
import { TemplateSourceActionsService } from "./template-source-actions.service";
import { updateTemplateSource } from "./update-template-source.service";

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

  updateSource = async (sourceId: string, payload: UpdateTemplateSourcePayload): Promise<void> => {
    runInAction(() => {
      this.port.actionBySourceId.set(sourceId, "update");
    });

    try {
      const updated = await updateTemplateSource(sourceId, payload);

      runInAction(() => {
        this.port.applySourceMetadataUpdate(sourceId, updated);
      });
    } finally {
      runInAction(() => {
        this.port.actionBySourceId.delete(sourceId);
      });
    }
  };

  deleteSource = (sourceId: string): Promise<ResourceDeleteResult> =>
    this.sourceActions.deleteSource(sourceId);

  checkSourceContentUpdate = async (
    sourceId: string,
    request: ContentUpdateCheckRequest,
    signal?: AbortSignal
  ): Promise<ContentUpdateCheckResult> => {
    runInAction(() => {
      this.port.actionBySourceId.set(sourceId, "content_update_check");
    });

    try {
      return await requestContentUpdateCheck(sourceId, request, signal);
    } finally {
      runInAction(() => {
        this.port.actionBySourceId.delete(sourceId);
      });
    }
  };

  applySourceContentUpdate = async (
    sourceId: string,
    request: ContentUpdateApplyRequest
  ): Promise<ContentUpdateApplyResult> => {
    runInAction(() => {
      this.port.actionBySourceId.set(sourceId, "content_update_apply");
    });

    try {
      return await requestContentUpdateApply(sourceId, request);
    } finally {
      await this.port.reloadSource(sourceId);
      runInAction(() => {
        this.port.actionBySourceId.delete(sourceId);
      });
    }
  };

  addSourceFile = async (sourceId: string, payload: AddSourceFilePayload): Promise<void> => {
    const source = this.port.getSource(sourceId);

    if (!source || !canAddSourceFiles(source, this.port)) {
      throw new Error("Cannot add file while source operation is in progress");
    }

    runInAction(() => {
      this.port.actionBySourceId.set(sourceId, "add_file");
    });

    try {
      await uploadSourceFile(sourceId, payload);
    } finally {
      runInAction(() => {
        this.port.actionBySourceId.delete(sourceId);
      });
      await this.port.reloadSource(sourceId);
    }
  };

  deleteSourceFile = async (sourceId: string, fileId: string): Promise<ResourceDeleteResult> => {
    const source = this.port.getSource(sourceId);

    if (!source || !canDeleteSourceFiles(source, this.port)) {
      throw new Error("Cannot delete file while source operation is in progress");
    }

    const result = await deleteSourceFileApi(sourceId, fileId);
    await this.port.reloadSource(sourceId);
    return result;
  };

  deleteSourceTemplate = (sourceId: string, templateId: string): Promise<void> => {
    const source = this.port.getSource(sourceId);

    if (!source || !canDeleteSourceTemplates(source, this.port)) {
      throw new Error("Cannot delete template while source operation is in progress");
    }

    if (getSourceActionContext(this.port, sourceId).actionKind === "delete_template") {
      throw new Error("Template delete already in progress");
    }

    return deleteSourceTemplateWithPolling(
      {
        bgTaskPolling: this.bgTaskPolling,
        patchOptimisticTask: (id, operation, taskId) =>
          runInAction(() => this.port.patchOptimisticTask(id, operation, taskId)),
        setActionState: (id) =>
          runInAction(() => {
            this.port.actionBySourceId.set(id, "delete_template");
          }),
        clearActionState: (id) =>
          runInAction(() => {
            this.port.actionBySourceId.delete(id);
          }),
        onComplete: () => this.port.reloadSource(sourceId),
      },
      sourceId,
      templateId
    );
  };
}
