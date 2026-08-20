import type {
  FormSchema,
  JSONSchema,
  UISchema,
  VisualEditorCompatibilityResult,
} from "@saltbox/react-jsonschema-form-generator";
import { makeAutoObservable, runInAction } from "mobx";

import { connectedLocalSourcesQuery } from "saltbox-core/features/configuration-templates/shared/helpers/connected-local-sources-query";
import {
  waitForBgTask,
  waitForBgTaskWithResult,
} from "saltbox-core/features/configuration-templates/shared/helpers/wait-for-bg-task";
import { extractTaskId } from "saltbox-core/shared/helpers/extract-task-id";
import {
  isValidManualSaltFunctionName,
  normalizeManualSaltFunctionName,
} from "saltbox-core/shared/utils/salt-function-name";
import { apiCoreStore } from "saltbox-core/store";

import { extractCreatedTemplateId } from "../helpers/extract-created-template-id";
import { isValidTemplateFileName } from "../helpers/validate-template-file-name";
import { hasLegacySchemaBlock, migrateLegacyTemplate } from "../lib/legacy-template";
import { getParamsCompatibility } from "../lib/params-compatibility";
import { extractParamsFormSchema, wrapParamsFormSchema } from "../lib/params-subtree";
import {
  applyTranslations,
  collectTemplateLocales,
  collectTranslationRows,
  type TranslationRow,
} from "../lib/template-i18n";
import {
  DEFAULT_TEMPLATE_FUN,
  getEmptyMeta,
  isSlsFunction,
  parseMeta,
  stringifyMeta,
  type TemplateMeta,
} from "../lib/template-meta";

export type TemplateEditorMode = "create" | "edit" | "duplicate";

export interface TemplateEditorParams {
  mode: TemplateEditorMode;
  sourceId: string;
  templateId?: string;
}

interface ParsedMeta {
  meta: TemplateMeta | null;
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

  fileName = "";
  slsRaw = "";
  metaText: string;
  /** Был ли у шаблона .sls при загрузке: сохранение без `sls_raw` его удаляет. */
  hadSlsContent = false;

  isSaving = false;
  isFunctionSchemaApplying = false;
  pendingFunctionChange: string | null = null;
  isFunctionDraftInvalid = false;
  sourceName: string | null = null;
  isLoadingTemplate = false;
  hasLoadError = false;

  targetSourceId: string | null = null;
  targetSources: DuplicateTargetSource[] = [];
  isLoadingTargetSources = false;
  previewLanguage: string | null = null;

  constructor(params: TemplateEditorParams) {
    this.mode = params.mode;
    this.sourceId = params.sourceId;
    this.templateId = params.templateId;
    this.metaText = stringifyMeta(getEmptyMeta(DEFAULT_TEMPLATE_FUN));

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

  get parsedMeta(): ParsedMeta {
    try {
      return { meta: parseMeta(this.metaText), error: null };
    } catch (error) {
      return { meta: null, error: (error as Error).message };
    }
  }

  get meta(): TemplateMeta | null {
    return this.parsedMeta.meta;
  }

  get metaError(): string | null {
    return this.parsedMeta.error;
  }

  get hasMetaError(): boolean {
    return this.parsedMeta.error !== null;
  }

  /** Функция шаблона из `meta`. */
  get fun(): string {
    return this.meta?.fun ?? "";
  }

  get isFunValid(): boolean {
    return isValidManualSaltFunctionName(normalizeManualSaltFunctionName(this.fun));
  }

  get isSlsFunction(): boolean {
    return isSlsFunction(this.fun);
  }

  get paramsFormSchema(): FormSchema | null {
    return this.meta ? extractParamsFormSchema(this.meta, this.fun) : null;
  }

  get paramsCompatibility(): VisualEditorCompatibilityResult | null {
    return this.meta ? getParamsCompatibility(this.meta, this.fun) : null;
  }

  /** Сохранение сотрёт существующий .sls: функция его больше не использует. */
  get willDeleteSls(): boolean {
    return this.hadSlsContent && !this.isSlsFunction;
  }

  /** В SLS остался блок схемы старого формата — его нужно перенести в `meta`. */
  get isLegacyTemplate(): boolean {
    return hasLegacySchemaBlock(this.slsRaw);
  }

  /** Переносит блок схемы из SLS в `meta`. Бросает, если блок — не валидный JSON. */
  migrateFromLegacyFormat = () => {
    const { meta, slsRaw } = migrateLegacyTemplate(this.meta ?? {}, this.slsRaw);

    this.metaText = stringifyMeta(meta);
    this.slsRaw = slsRaw;
  };

  setFileName = (value: string) => {
    this.fileName = value;
  };

  setSlsRaw = (value: string) => {
    this.slsRaw = value;
  };

  setMetaText = (value: string) => {
    this.metaText = value;
  };

  setTargetSourceId = (value: string | null) => {
    this.targetSourceId = value;
  };

  setFunctionSchemaApplying = (value: boolean) => {
    this.isFunctionSchemaApplying = value;
  };

  setPendingFunctionChange = (value: string | null) => {
    this.pendingFunctionChange = value;
  };

  setFunctionDraftInvalid = (value: boolean) => {
    this.isFunctionDraftInvalid = value;
  };

  private updateMeta = (update: (meta: TemplateMeta) => TemplateMeta) => {
    const meta = this.meta;
    // Текст схемы сломан — правки из формы применять некуда
    if (!meta) return;

    this.metaText = stringifyMeta(update(meta));
  };

  setFun = (fun: string) => {
    const normalizedFun = normalizeManualSaltFunctionName(fun);
    this.updateMeta((meta) => ({ ...meta, fun: normalizedFun }));
  };

  /**
   * Меняет функцию вместе со схемой: подставляет схему из каталога, а когда её
   * нет — пустой каркас под параметры этой функции.
   */
  applyFunction = (
    fun: string,
    catalogSchema?: { json_schema?: JSONSchema; ui_schema?: UISchema } | null
  ) => {
    const normalizedFun = normalizeManualSaltFunctionName(fun);

    this.updateMeta((meta) => {
      if (!catalogSchema?.json_schema) {
        const empty = getEmptyMeta(normalizedFun);
        return {
          ...meta,
          fun: normalizedFun,
          json_schema: empty.json_schema,
          ui_schema: empty.ui_schema,
        };
      }

      return {
        ...meta,
        fun: normalizedFun,
        json_schema: catalogSchema.json_schema,
        ui_schema: catalogSchema.ui_schema ?? {},
      };
    });
  };

  setParamsFormSchema = (edited: FormSchema | JSONSchema) => {
    this.updateMeta((meta) => wrapParamsFormSchema(meta, this.fun, edited));
  };

  get translationLocales(): string[] {
    return collectTemplateLocales(this.meta);
  }

  get translationRows(): TranslationRow[] {
    return collectTranslationRows(this.meta);
  }

  setTranslations = (key: string, values: Record<string, string>) => {
    this.updateMeta((meta) => applyTranslations(meta, key, values));
    if (this.previewLanguage && !this.translationLocales.includes(this.previewLanguage)) {
      this.previewLanguage = null;
    }
  };

  setPreviewLanguage = (language: string) => {
    this.previewLanguage = language;
  };

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
        const meta = (template?.meta ?? {}) as TemplateMeta;
        const fun =
          normalizeManualSaltFunctionName(meta.fun ?? "") ||
          normalizeManualSaltFunctionName(template?.fun ?? "") ||
          DEFAULT_TEMPLATE_FUN;

        this.metaText = stringifyMeta({ ...meta, fun });
        this.slsRaw = template?.sls_content ?? "";
        this.hadSlsContent = Boolean(template?.sls_content?.trim());

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

  save = async (): Promise<string | undefined> => {
    const meta = this.meta;
    if (!meta) {
      throw new Error("cannot save a template with unparsable meta");
    }

    const normalizedFun = normalizeManualSaltFunctionName(this.fun);
    if (!isValidManualSaltFunctionName(normalizedFun)) {
      throw new Error("invalid template function");
    }

    // `sls_raw` отправляем всегда, пока функция его использует: без него
    // бекенд удаляет существующий .sls-файл шаблона
    const slsRaw = isSlsFunction(normalizedFun) ? this.slsRaw : null;
    const payloadMeta = { ...meta, fun: normalizedFun } as Record<string, unknown>;

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
            file_name: this.fileName.trim(),
            sls_raw: slsRaw,
            meta: payloadMeta,
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
          sls_raw: slsRaw,
          meta: payloadMeta,
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
