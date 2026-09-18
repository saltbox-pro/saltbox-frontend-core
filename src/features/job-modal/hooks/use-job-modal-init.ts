import type {
  CreateJobRequest,
  CreateJobRequestTgtTypeEnum,
  MasterViewSchema,
  TaskTemplateModel,
} from "@saltbox/saltbox-core-api-client";
import {
  useAcceptedMastersErrorMessage,
  useAcceptedMastersWarningMessage,
  type TemplateSchemaError,
} from "@saltbox/saltbox-frontend-common";
import type { FormInstance } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import type { TFunction } from "i18next";
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { notifyApiError } from "saltbox-core/shared/helpers/notify-api-error";
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
import { getTemplateTitleText } from "saltbox-core/shared/utils/template-localized-text";
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

const NO_ACCEPTED_MASTERS_ERROR = "NO_ACCEPTED_MASTERS";

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

  if (!result?.data?.length) {
    throw new Error(NO_ACCEPTED_MASTERS_ERROR);
  }

  return mapMastersToOptions(result.data);
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
  getTemplateTitleText(template.title, language) || template.name || template.fun || "";

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
  const acceptedMastersErrorMessage = useAcceptedMastersErrorMessage();
  const renderWarningMessage = useAcceptedMastersWarningMessage();
  const navigate = useNavigate();
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [masterList, setMasterList] = useState<MasterOption[]>([]);
  const [paramsSource, setParamsSource] = useState<JobParamsSource>();
  const [schemaError, setSchemaError] = useState<TemplateSchemaError | null>(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [sourceDisplayName, setSourceDisplayName] = useState<string | undefined>(sourceName);
  const [jsonFormValue, setJsonFormValue] = useState<Record<string, unknown>>({});
  const [baselineKwarg, setBaselineKwarg] = useState<Record<string, unknown>>();
  const [ttlValue, setTtlValue] = useState<number | null>(null);
  const [ttlUnit, setTtlUnit] = useState<TtlUnit>("seconds");

  const loadRequestIdRef = useRef(0);

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

  const initializeModal = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;
    setIsInitialLoading(true);
    resetLoadedData();

    try {
      const isTemplateMode = Boolean(sourceId && templateId);

      if (isTemplateMode) {
        const [source, resolvedSourceName] = await Promise.all([
          loadParamsSource(fun, sourceId, templateId, allowBuiltinSchemaFallback),
          resolveSourceDisplayName(sourceId, sourceName),
        ]);

        if (requestId !== loadRequestIdRef.current) {
          return;
        }

        if (source.kind === "template") {
          const error = getTemplateSchemaError(source.template, language);
          if (error) {
            setParamsSource(source);
            setSchemaError(error);
            setTemplateTitle(getTemplateTitle(source.template, language));
            setSourceDisplayName(resolvedSourceName);
            applyTargetFormValues(form, target, targetType, defaultMaster);
            return;
          }
        }

        const masters = await loadAcceptedMasters();
        if (requestId !== loadRequestIdRef.current) {
          return;
        }

        if (source.kind === "function" && source.fallbackFromTemplate) {
          messageApi.warning(t("job-modal.warning-template-unavailable"));
        }

        applyReadySource(source, masters, resolvedSourceName);
        return;
      }

      const [masters, source] = await Promise.all([
        loadAcceptedMasters(),
        loadParamsSource(fun, sourceId, templateId, allowBuiltinSchemaFallback),
      ]);

      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      applyReadySource(source, masters, undefined);
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      if (error instanceof Error && error.message === NO_ACCEPTED_MASTERS_ERROR) {
        messageApi.warning(
          renderWarningMessage({
            action: t("job-modal.warning-action.create-job"),
            navigate,
          })
        );
      } else {
        await notifyApiError(
          error,
          sourceId && templateId
            ? t("task-create.error-loading-template")
            : acceptedMastersErrorMessage
        );
      }

      onLoadFailed();
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsInitialLoading(false);
      }
    }
  }, [
    acceptedMastersErrorMessage,
    allowBuiltinSchemaFallback,
    applyReadySource,
    defaultMaster,
    form,
    fun,
    language,
    messageApi,
    navigate,
    onLoadFailed,
    renderWarningMessage,
    resetLoadedData,
    sourceId,
    sourceName,
    t,
    target,
    targetType,
    templateId,
  ]);

  const cancelInit = useCallback(() => {
    loadRequestIdRef.current += 1;
  }, []);

  return {
    isInitialLoading,
    isFormReady: !isInitialLoading && paramsSource != null,
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
