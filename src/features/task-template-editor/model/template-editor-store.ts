import type { FormSchema } from "@saltbox/react-jsonschema-form-generator";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

import {
  combineSchemaAndBody,
  extractSlsBody,
  getEmptySchema,
  getEmptySlsBody,
  parseSchemaFromSls,
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
        await apiCoreStore.newTaskTemplatesApi?.newTemplateCreate({
          TaskTemplateFromRawCreateSchema: {
            source_id: this.sourceId,
            file_name: this.fileName.trim(),
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
