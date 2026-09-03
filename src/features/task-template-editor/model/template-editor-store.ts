import {
  canRenderInVisualEditor,
  type FormSchema,
  type JSONSchema,
  type VisualEditorCompatibilityResult,
} from "@saltbox/react-jsonschema-form-generator";
import type { TaskTemplateMetaSchemaInput } from "@saltbox/saltbox-core-api-client";
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
import { apiCoreStore, i18nStore } from "saltbox-core/store";

import { extractCreatedTemplateId } from "../helpers/extract-created-template-id";
import { isValidTemplateFileName } from "../helpers/validate-template-file-name";
import { hasLegacySchemaBlock, migrateLegacyTemplate } from "../lib/legacy-template";
import { migrateMetaFormat } from "../lib/migrate-meta-format";
import { getParamsCompatibility } from "../lib/params-compatibility";
import { extractParamsFormSchema, wrapParamsFormSchema } from "../lib/params-subtree";
import { readTemplateLabel, writeTemplateLabel, type TemplateLabelKey } from "../lib/root-labels";
import { readSecretNames, syncSecretWidgets, writeSecretNames } from "../lib/secret-pillars";
import {
  applyTranslations,
  collectTemplateLocales,
  collectTranslationKeys,
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

/** Параметр формы верхнего уровня — для списка вставки в SLS и статуса схемы. */
export interface TemplateParamSummary {
  name: string;
  schema: JSONSchema | undefined;
  isRequired: boolean;
  isSecret: boolean;
  /** Визуальный редактор не разбирает конструкцию: правится только в Meta JSON. */
  isUnsupported: boolean;
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
  /** Свитч "Расширенные параметры": открывает табы Meta JSON и Переводы. */
  isAdvancedMode = false;
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

  setAdvancedMode = (value: boolean) => {
    this.isAdvancedMode = value;
  };

  private updateMeta = (update: (meta: TemplateMeta) => TemplateMeta) => {
    const meta = this.meta;
    // Текст схемы сломан — правки из формы применять некуда
    if (!meta) return;

    this.metaText = stringifyMeta(update(meta));
  };

  /**
   * Название и описание шаблона живут в корне `meta`: оттуда их читают списки
   * шаблонов и форма создания задачи, и туда же можно положить плейсхолдер
   * перевода.
   */
  private setRootLabel = (key: TemplateLabelKey, value: string) => {
    this.updateMeta((meta) => writeTemplateLabel(meta, key, value, i18nStore.currentLanguage));
  };

  private getRootLabel = (key: TemplateLabelKey): string =>
    readTemplateLabel(this.meta, key, i18nStore.currentLanguage);

  get templateTitle(): string {
    return this.getRootLabel("title");
  }

  setTemplateTitle = (value: string) => {
    this.setRootLabel("title", value);
  };

  get templateDescription(): string {
    return this.getRootLabel("description");
  }

  setTemplateDescription = (value: string) => {
    this.setRootLabel("description", value);
  };

  get secretNames(): string[] {
    return this.meta ? readSecretNames(this.meta, this.fun) : [];
  }

  setSecretNames = (names: string[]) => {
    this.updateMeta((meta) => writeSecretNames(meta, names, this.fun));
  };

  get paramsProperties(): TemplateParamSummary[] {
    const jsonSchema = this.paramsFormSchema?.json_schema;
    if (!jsonSchema || typeof jsonSchema === "boolean") return [];

    const required = new Set(jsonSchema.required ?? []);
    const secret = new Set(this.secretNames);

    return Object.entries(jsonSchema.properties ?? {}).map(([name, schema]) => ({
      name,
      schema,
      isRequired: required.has(name),
      isSecret: secret.has(name),
      isUnsupported: !canRenderInVisualEditor({ json_schema: schema, ui_schema: {} }).compatible,
    }));
  }

  /**
   * Подписи заданы плейсхолдерами — их значения правят на вкладке переводов,
   * поэтому её показываем и при выключенных расширенных параметрах.
   */
  get hasTranslationPlaceholders(): boolean {
    return collectTranslationKeys(this.meta).size > 0;
  }

  /**
   * Расширенные вкладки нужны сразу: конструкции, которые визуальный редактор
   * не разбирает, правятся только в Meta JSON. Прятать его за выключенным
   * свитчем значило бы спрятать единственный способ их отредактировать.
   */
  get shouldForceAdvanced(): boolean {
    return this.paramsCompatibility?.compatible === false;
  }

  setParamsFormSchema = (edited: FormSchema | JSONSchema) => {
    this.updateMeta((meta) =>
      syncSecretWidgets(wrapParamsFormSchema(meta, this.fun, edited), this.fun)
    );
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

        // Подписи из `ui_schema` и полные пути в `secret_pillars` — форматы
        // прошлой версии редактора: приводим их к текущему сразу при открытии
        this.metaText = stringifyMeta(migrateMetaFormat({ ...meta, fun }, fun));
        this.slsRaw = template?.sls_content ?? "";
        this.hadSlsContent = Boolean(template?.sls_content?.trim());

        if (this.mode === "edit") {
          this.fileName = template?.name ?? "";
        }

        // Открываем расширенные вкладки сразу, если в шаблоне есть то, что
        // правится только на них: сложные конструкции схемы или переводы
        this.isAdvancedMode = this.shouldForceAdvanced;
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

    const slsRaw = isSlsFunction(normalizedFun) ? this.slsRaw : "";
    const payloadMeta = {
      ...meta,
      fun: normalizedFun,
    } as unknown as TaskTemplateMetaSchemaInput;

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
