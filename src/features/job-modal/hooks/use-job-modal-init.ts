import type {
  CreateJobRequest,
  CreateJobRequestTgtTypeEnum,
  MasterViewSchema,
  TaskTemplateModel,
} from "@saltbox/saltbox-core-api-client";
import {
  createLoader,
  getLocalizedText,
  useAcceptedMastersWarningMessage,
  type LoadSource,
  type TemplateSchemaError,
} from "@saltbox/saltbox-frontend-common";
import type { FormInstance } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import type { TFunction } from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { taskTemplateService } from "saltbox-core/shared/services/task-template.service";
import { getBuiltinJobSchema, type BuiltinJobSchemaMeta } from "saltbox-core/shared/sls-templates";
import {
  cleanNullsFromKwargs,
  getDefaultJsonFormValue,
  getRepeatJsonFormValue,
  hasBaselineJobArgs,
  parseTtlValue,
  pruneKwargsBySchema,
  totalSecondsToTtlParts,
  type TtlUnit,
} from "saltbox-core/shared/utils/job-modal-utils";
import { getTemplateSchemaError } from "saltbox-core/shared/utils/template-schema-validation";
import { apiCoreStore } from "saltbox-core/store";

export type MasterOption = {
  value: string;
  label: string;
};

export type JobModalFormValues = Pick<CreateJobRequest, "tgt" | "tgt_type" | "salt_master">;

export type JobParamsSource =
  | { kind: "template"; template: TaskTemplateModel }
  | { kind: "function"; schema: BuiltinJobSchemaMeta; fallbackFromTemplate?: boolean };

type UseJobModalInitParams = {
  fun: string;
  sourceId?: string;
  sourceName?: string;
  templateId?: string;
  language: string;
  allowBuiltinSchemaFallback?: boolean;
  initialJsonFormValue?: Record<string, unknown>;
  arg?: unknown[];
  kwarg?: Record<string, unknown>;
  target?: string;
  targetType?: CreateJobRequestTgtTypeEnum;
  defaultMaster?: string;
  initialTtlSeconds?: number;
  form: FormInstance<JobModalFormValues>;
  messageApi: MessageInstance;
  t: TFunction;
  onLoadFailed: () => void;
};

/**
 * Результат инициализации. Отсутствие принятых мастеров — не ошибка загрузки, а штатная
 * ветка со своим предупреждением, поэтому она приходит успешным результатом, а не исключением.
 */
type JobModalInitResult =
  | { kind: "no-masters" }
  | {
      kind: "schema-error";
      template: TaskTemplateModel;
      error: TemplateSchemaError;
      resolvedSourceName: string | undefined;
    }
  | {
      kind: "ready";
      source: JobParamsSource;
      masters: MasterOption[];
      resolvedSourceName: string | undefined;
    };

const mapMastersToOptions = (masters: MasterViewSchema[]): MasterOption[] =>
  masters.map((master) => ({
    label: master.title,
    value: master.master_id,
  }));

const loadAcceptedMasters = async (): Promise<MasterOption[]> => {
  const result = await apiCoreStore.mastersApi?.mastersList({
    MasterListBody: {
      query: {
        status: "accepted",
      },
    },
  });

  return mapMastersToOptions(result?.data ?? []);
};

const loadParamsSource = async (
  fun: string,
  sourceId?: string,
  templateId?: string,
  allowBuiltinSchemaFallback?: boolean
): Promise<JobParamsSource> => {
  if (sourceId && templateId) {
    try {
      const template = await taskTemplateService.loadTemplateById(sourceId, templateId);
      return { kind: "template", template };
    } catch (error) {
      if (!allowBuiltinSchemaFallback) {
        throw error;
      }

      return { kind: "function", schema: getBuiltinJobSchema(fun), fallbackFromTemplate: true };
    }
  }

  return { kind: "function", schema: getBuiltinJobSchema(fun) };
};

const getParamsJsonSchema = (source: JobParamsSource): unknown =>
  source.kind === "template" ? source.template.json_schema : source.schema.json_schema;

const getInitialJsonFormValue = (
  source: JobParamsSource,
  initialJsonFormValue: Record<string, unknown> | undefined,
  arg: unknown[] | undefined,
  kwarg: Record<string, unknown> | undefined
): Record<string, unknown> => {
  const jsonSchema = getParamsJsonSchema(source);

  if (initialJsonFormValue) {
    return initialJsonFormValue;
  }

  return hasBaselineJobArgs(arg, kwarg)
    ? getRepeatJsonFormValue(arg, kwarg, jsonSchema)
    : getDefaultJsonFormValue(jsonSchema);
};

const getBaselineKwarg = (
  source: JobParamsSource,
  kwarg: Record<string, unknown> | undefined
): Record<string, unknown> | undefined =>
  kwarg ? pruneKwargsBySchema(cleanNullsFromKwargs(kwarg), getParamsJsonSchema(source)) : undefined;

const getTemplateTitle = (template: TaskTemplateModel, language: string): string =>
  getLocalizedText(template.title, language) || template.name || template.fun || "";

const resolveSourceDisplayName = async (
  sourceId: string | undefined,
  sourceName: string | undefined
): Promise<string | undefined> => {
  if (sourceName) {
    return sourceName;
  }

  if (!sourceId) {
    return undefined;
  }

  try {
    const source = await apiCoreStore.taskTemplateSourcesApi?.templateSourceGet({
      source_id: sourceId,
    });
    return source?.name;
  } catch {
    return undefined;
  }
};

const applyTargetFormValues = (
  form: FormInstance<JobModalFormValues>,
  target: string | undefined,
  targetType: CreateJobRequestTgtTypeEnum | undefined,
  saltMaster: string | undefined
) => {
  form.resetFields();
  form.setFieldsValue({
    tgt: target,
    tgt_type: targetType,
    salt_master: saltMaster,
  });
};

const getSourceDefaultTtl = (source: JobParamsSource): unknown =>
  source.kind === "template" ? source.template.defaults?.ttl : source.schema.defaults?.ttl;

export const useJobModalInit = ({
  fun,
  sourceId,
  sourceName,
  templateId,
  language,
  allowBuiltinSchemaFallback,
  initialJsonFormValue,
  arg,
  kwarg,
  target,
  targetType,
  defaultMaster,
  initialTtlSeconds,
  form,
  messageApi,
  t,
  onLoadFailed,
}: UseJobModalInitParams) => {
  const renderWarningMessage = useAcceptedMastersWarningMessage();
  const navigate = useNavigate();
  const [masterList, setMasterList] = useState<MasterOption[]>([]);
  const [paramsSource, setParamsSource] = useState<JobParamsSource>();
  const [schemaError, setSchemaError] = useState<TemplateSchemaError | null>(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [sourceDisplayName, setSourceDisplayName] = useState<string | undefined>(sourceName);
  const [jsonFormValue, setJsonFormValue] = useState<Record<string, unknown>>({});
  const [baselineKwarg, setBaselineKwarg] = useState<Record<string, unknown>>();
  const [ttlValue, setTtlValue] = useState<number | null>(null);
  const [ttlUnit, setTtlUnit] = useState<TtlUnit>("seconds");

  const runInitRef = useRef<() => Promise<JobModalInitResult>>(() =>
    Promise.resolve({ kind: "no-masters" })
  );
  const applyResultRef = useRef<(result: JobModalInitResult, token: number) => void>(
    () => undefined
  );

  const initTokenRef = useRef(0);

  const [initLoad] = useState(() =>
    createLoader({
      run: async (token: number) => {
        const ensureNotCancelled = () => {
          if (token === initTokenRef.current) return;
          const cancelled = new Error("Job modal initialization cancelled");
          cancelled.name = "AbortError";
          throw cancelled;
        };

        try {
          const result = await runInitRef.current();
          ensureNotCancelled();
          return result;
        } catch (error) {
          ensureNotCancelled();
          throw error;
        }
      },
      onSuccess: (result, token) => applyResultRef.current(result, token),
    })
  );

  const applyTtlFromInitialOrDefault = useCallback(
    (totalSeconds: number | null | undefined, defaultTtl: unknown) => {
      if (totalSeconds != null && Number.isFinite(totalSeconds) && totalSeconds >= 0) {
        const parts = totalSecondsToTtlParts(totalSeconds);
        setTtlValue(parts.value);
        setTtlUnit(parts.unit);
        return;
      }
      setTtlValue(parseTtlValue(defaultTtl));
      setTtlUnit("seconds");
    },
    []
  );

  const resetLoadedData = useCallback(() => {
    setMasterList([]);
    setParamsSource(undefined);
    setSchemaError(null);
    setTemplateTitle("");
    setSourceDisplayName(sourceName);
    setJsonFormValue({});
    setBaselineKwarg(undefined);
    setTtlValue(null);
    setTtlUnit("seconds");
  }, [sourceName]);

  const applyReadySource = useCallback(
    (source: JobParamsSource, masters: MasterOption[], resolvedSourceName: string | undefined) => {
      setMasterList(masters);
      setParamsSource(source);
      setSchemaError(null);
      setTemplateTitle(
        source.kind === "template" ? getTemplateTitle(source.template, language) : ""
      );
      setSourceDisplayName(resolvedSourceName);
      setJsonFormValue(getInitialJsonFormValue(source, initialJsonFormValue, arg, kwarg));
      setBaselineKwarg(getBaselineKwarg(source, kwarg));
      applyTtlFromInitialOrDefault(initialTtlSeconds, getSourceDefaultTtl(source));
      applyTargetFormValues(form, target, targetType, defaultMaster || masters[0]?.value);
    },
    [
      applyTtlFromInitialOrDefault,
      arg,
      defaultMaster,
      form,
      initialJsonFormValue,
      initialTtlSeconds,
      kwarg,
      language,
      target,
      targetType,
    ]
  );

  const runInit = useCallback(async (): Promise<JobModalInitResult> => {
    const isTemplateMode = Boolean(sourceId && templateId);

    if (isTemplateMode) {
      const [source, resolvedSourceName] = await Promise.all([
        loadParamsSource(fun, sourceId, templateId, allowBuiltinSchemaFallback),
        resolveSourceDisplayName(sourceId, sourceName),
      ]);

      if (source.kind === "template") {
        const error = getTemplateSchemaError(source.template, language);
        if (error) {
          return { kind: "schema-error", template: source.template, error, resolvedSourceName };
        }
      }

      const masters = await loadAcceptedMasters();
      if (!masters.length) {
        return { kind: "no-masters" };
      }

      return { kind: "ready", source, masters, resolvedSourceName };
    }

    const [masters, source] = await Promise.all([
      loadAcceptedMasters(),
      loadParamsSource(fun, sourceId, templateId, allowBuiltinSchemaFallback),
    ]);

    if (!masters.length) {
      return { kind: "no-masters" };
    }

    return { kind: "ready", source, masters, resolvedSourceName: undefined };
  }, [allowBuiltinSchemaFallback, fun, language, sourceId, sourceName, templateId]);

  const applyResult = useCallback(
    (result: JobModalInitResult, token: number) => {
      if (token !== initTokenRef.current) {
        return;
      }

      if (result.kind === "no-masters") {
        messageApi.warning(
          renderWarningMessage({
            action: t("job-modal.warning-action.create-job"),
            navigate,
          })
        );
        onLoadFailed();
        return;
      }

      if (result.kind === "schema-error") {
        setParamsSource({ kind: "template", template: result.template });
        setSchemaError(result.error);
        setTemplateTitle(getTemplateTitle(result.template, language));
        setSourceDisplayName(result.resolvedSourceName);
        applyTargetFormValues(form, target, targetType, defaultMaster);
        return;
      }

      if (result.source.kind === "function" && result.source.fallbackFromTemplate) {
        messageApi.warning(t("job-modal.warning-template-unavailable"));
      }

      applyReadySource(result.source, result.masters, result.resolvedSourceName);
    },
    [
      applyReadySource,
      defaultMaster,
      form,
      language,
      messageApi,
      navigate,
      onLoadFailed,
      renderWarningMessage,
      t,
      target,
      targetType,
    ]
  );

  useEffect(() => {
    runInitRef.current = runInit;
    applyResultRef.current = applyResult;
  });

  const initializeModal = useCallback(() => {
    const token = ++initTokenRef.current;
    resetLoadedData();
    initLoad.run(token).catch(() => undefined);
  }, [initLoad, resetLoadedData]);

  const cancelInit = useCallback(() => {
    initTokenRef.current += 1;
  }, []);

  return {
    isInitialLoading: initLoad.isLoading,
    isFormReady: !initLoad.isLoading && paramsSource != null,
    initLoad: initLoad as LoadSource,
    masterList,
    paramsSource,
    schemaError,
    templateTitle,
    sourceDisplayName,
    jsonFormValue,
    setJsonFormValue,
    baselineKwarg,
    ttlValue,
    setTtlValue,
    ttlUnit,
    setTtlUnit,
    initializeModal,
    resetLoadedData,
    cancelInit,
  };
};
