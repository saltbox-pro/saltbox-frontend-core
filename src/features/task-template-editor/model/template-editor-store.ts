import { makeAutoObservable, runInAction } from "mobx";

import { connectedLocalSourcesQuery } from "saltbox-core/features/configuration-templates/shared/helpers/connected-local-sources-query";
import {
  waitForBgTask,
  waitForBgTaskWithResult,
} from "saltbox-core/features/configuration-templates/shared/helpers/wait-for-bg-task";
import { extractTaskId } from "saltbox-core/shared/helpers/extract-task-id";
import { apiCoreStore } from "saltbox-core/store";

import { extractCreatedTemplateId } from "../helpers/extract-created-template-id";
import { isValidTemplateFileName } from "../helpers/validate-template-file-name";
import {
  combineSchemaAndBody,
  extractSlsBody,
  getEmptySchema,
  getEmptySlsBody,
  parseSchemaFromSls,
  stripSlsExtension,
  type TemplateFormSchema,
} from "../lib/sls-parser";

export type TemplateEditorMode = "create" | "edit" | "duplicate";

export interface TemplateEditorParams {
  mode: TemplateEditorMode;
  sourceId: string;
  templateId?: string;
  initialSls?: string;
}

interface ParsedSls {
  schema: TemplateFormSchema | null;
  slsBody: string;
  error: string | null;
}

export interface DuplicateTargetSource {
  id: string;
  name: string;
}

export class TemplateEditorStore {
  readonly mode: TemplateEditorMode;
  readonly sourceId: string;
  readonly templateId?: string;

  rawSls: string;
  fileName = "";
  isSaving = false;
  sourceName: string | null = null;
  isLoadingTemplate = false;
  hasLoadError = false;

  targetSourceId: string | null = null;
  targetSources: DuplicateTargetSource[] = [];
  isLoadingTargetSources = false;

  constructor(params: TemplateEditorParams) {
    this.mode = params.mode;
    this.sourceId = params.sourceId;
    this.templateId = params.templateId;
    this.rawSls = params.initialSls ?? combineSchemaAndBody(getEmptySchema(), getEmptySlsBody());

    makeAutoObservable(this);
  }

  get createsNewTemplate(): boolean {
    return this.mode !== "edit";
  }

  get isDuplicate(): boolean {
    return this.mode === "duplicate";
  }

  get effectiveTargetSourceId(): string | null {
    return this.isDuplicate ? this.targetSourceId : this.sourceId;
  }

  loadTemplate = async () => {
    if (!this.templateId) return;

    runInAction(() => {
      this.isLoadingTemplate = true;
      this.hasLoadError = false;
    });

    try {
      const template = await apiCoreStore.taskTemplatesApi?.taskTemplateRead({
        source_id: this.sourceId,
        template_id: this.templateId,
      });

      runInAction(() => {
        if (template?.sls_content != null) {
          this.rawSls = template.sls_content;
        }
        if (this.mode === "edit") {
          this.fileName = template?.name ?? "";
        }
      });
    } catch (error) {
      console.error("Failed to load template:", error);
      runInAction(() => {
        this.hasLoadError = true;
      });
    } finally {
      runInAction(() => {
        this.isLoadingTemplate = false;
      });
    }
  };

  loadTargetSources = async () => {
    runInAction(() => {
      this.isLoadingTargetSources = true;
    });

    try {
      const response = await apiCoreStore.taskTemplateSourcesApi?.templateSourceList({
        TemplateSourceListBody: {
          query: connectedLocalSourcesQuery,
        },
      });

      const editable = (response?.data ?? []).map((source) => ({
        id: source.id,
        name: source.name,
      }));

      runInAction(() => {
        this.targetSources = editable;
      });
    } catch (error) {
      console.error("Failed to load target template sources:", error);
    } finally {
      runInAction(() => {
        this.isLoadingTargetSources = false;
      });
    }
  };

  setTargetSourceId = (value: string | null) => {
    this.targetSourceId = value;
  };

  loadSource = async () => {
    try {
      const source = await apiCoreStore.taskTemplateSourcesApi?.templateSourceGet({
        source_id: this.sourceId,
      });
      runInAction(() => {
        this.sourceName = source?.name ?? null;
      });
    } catch (error) {
      console.error("Failed to load template source:", error);
    }
  };

  get parsed(): ParsedSls {
    try {
      return {
        schema: parseSchemaFromSls(this.rawSls),
        slsBody: extractSlsBody(this.rawSls),
        error: null,
      };
    } catch (error) {
      return {
        schema: null,
        slsBody: this.rawSls,
        error: (error as Error).message,
      };
    }
  }

  get schema(): TemplateFormSchema | null {
    return this.parsed.schema;
  }

  get hasParseError(): boolean {
    return this.parsed.error !== null;
  }

  get parseError(): string | null {
    return this.parsed.error;
  }

  setRawSls = (value: string) => {
    this.rawSls = value;
  };

  setFileName = (value: string) => {
    this.fileName = value;
  };

  setSchema = (schema: TemplateFormSchema) => {
    if (this.hasParseError) return;
    this.rawSls = combineSchemaAndBody(schema, this.parsed.slsBody);
  };

  save = async (): Promise<string | undefined> => {
    runInAction(() => {
      this.isSaving = true;
    });

    try {
      if (this.createsNewTemplate) {
        const targetSourceId = this.effectiveTargetSourceId;
        if (!targetSourceId) {
          throw new Error("target source is required to create a template");
        }
        if (!isValidTemplateFileName(this.fileName)) {
          throw new Error("invalid template file name");
        }
        const response = await apiCoreStore.taskTemplatesApi?.taskTemplateCreate({
          source_id: targetSourceId,
          TaskTemplateFromRawCreateSchema: {
            file_name: stripSlsExtension(this.fileName),
            content: this.rawSls,
          },
        });
        if (!response) {
          return undefined;
        }

        const result = await waitForBgTaskWithResult(extractTaskId(response));

        return extractCreatedTemplateId(result.return_value);
      }

      if (!this.templateId) {
        throw new Error("templateId is required to update a template");
      }
      const response = await apiCoreStore.taskTemplatesApi?.taskTemplateUpdate({
        source_id: this.sourceId,
        template_id: this.templateId,
        TaskTemplateFromRawUpdateSchema: {
          content: this.rawSls,
        },
      });
      if (response) {
        await waitForBgTask(extractTaskId(response));
      }

      return this.templateId;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  };
}
