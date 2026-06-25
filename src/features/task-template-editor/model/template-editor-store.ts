import type { FormSchema } from "@saltbox/react-jsonschema-form-generator";
import { SourceState, SourceType } from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

import {
  combineSchemaAndBody,
  extractSlsBody,
  getEmptySchema,
  getEmptySlsBody,
  parseSchemaFromSls,
  stripSlsExtension,
} from "../lib/sls-parser";

export type TemplateEditorMode = "create" | "edit" | "duplicate";

export interface TemplateEditorParams {
  mode: TemplateEditorMode;
  sourceId: string;
  templateId?: string;
  initialSls?: string;
}

interface ParsedSls {
  schema: FormSchema | null;
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

  /** Источник, в который будет записан шаблон при сохранении. */
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
      const template = await apiCoreStore.newTaskTemplatesApi?.newTemplateRead({
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
        TemplateSourceListBody: {},
      });

      const editable = (response?.data ?? [])
        .filter(
          (source) =>
            source.source_type === SourceType.LocalBundle &&
            (source.state === SourceState.Plugged || source.state === SourceState.Active)
        )
        .map((source) => ({ id: source.id, name: source.name }));

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

  get schema(): FormSchema | null {
    return this.parsed.schema;
  }

  get hasParseError(): boolean {
    return this.parsed.error !== null;
  }

  get parseError(): string | null {
    return this.parsed.error;
  }

  get canSave(): boolean {
    if (this.hasParseError) return false;
    if (!this.createsNewTemplate) return true;
    if (this.isDuplicate && !this.targetSourceId) return false;
    return this.fileName.trim().length > 0;
  }

  setRawSls = (value: string) => {
    this.rawSls = value;
  };

  setFileName = (value: string) => {
    this.fileName = value;
  };

  setSchema = (schema: FormSchema) => {
    if (this.hasParseError) return;
    this.rawSls = combineSchemaAndBody(schema, this.parsed.slsBody);
  };

  save = async (): Promise<void> => {
    runInAction(() => {
      this.isSaving = true;
    });

    try {
      if (this.createsNewTemplate) {
        const targetSourceId = this.effectiveTargetSourceId;
        if (!targetSourceId) {
          throw new Error("target source is required to create a template");
        }
        await apiCoreStore.newTaskTemplatesApi?.newTemplateCreate({
          TaskTemplateFromRawCreateSchema: {
            source_id: targetSourceId,
            file_name: stripSlsExtension(this.fileName),
            content: this.rawSls,
          },
        });
      } else {
        if (!this.templateId) {
          throw new Error("templateId is required to update a template");
        }
        await apiCoreStore.newTaskTemplatesApi?.newTemplateUpdate({
          template_id: this.templateId,
          TaskTemplateFromRawUpdateSchema: {
            content: this.rawSls,
          },
        });
      }
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  };
}
