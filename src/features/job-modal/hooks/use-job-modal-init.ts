import type {
  CreateJobRequest,
  CreateJobRequestTgtTypeEnum,
  MasterViewSchema,
  TaskTemplateModel,
} from "@saltbox/saltbox-core-api-client";
import {
  useAcceptedMastersErrorMessage,
  useAcceptedMastersWarningMessage,
} from "@saltbox/saltbox-frontend-common";
import type { FormInstance } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import type { TFunction } from "i18next";
import { useCallback, useRef, useState } from "react";
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
import { apiCoreStore } from "saltbox-core/store";

export type MasterOption = {
  value: string;
  label: string;
};

export type JobModalFormValues = Pick<CreateJobRequest, "tgt" | "tgt_type" | "salt_master">;

export type JobParamsSource =
  | { kind: "template"; template: TaskTemplateModel }
  | { kind: "function"; schema: BuiltinJobSchemaMeta };

type UseJobModalInitParams = {
  fun: string;
  sourceId?: string;
  templateId?: string;
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
const MASTERS_LOAD_FAILED_ERROR = "MASTERS_LOAD_FAILED";
const TEMPLATE_LOAD_FAILED_ERROR = "TEMPLATE_LOAD_FAILED";

const mapMastersToOptions = (masters: MasterViewSchema[]): MasterOption[] =>
  masters.map((master) => ({
    label: master.title,
    value: master.master_id,
  }));

const loadAcceptedMasters = async (): Promise<MasterOption[]> => {
  try {
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
  } catch (error) {
    if (error instanceof Error && error.message === NO_ACCEPTED_MASTERS_ERROR) {
      throw error;
    }
    throw new Error(MASTERS_LOAD_FAILED_ERROR);
  }
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
    } catch {
      if (!allowBuiltinSchemaFallback) {
        throw new Error(TEMPLATE_LOAD_FAILED_ERROR);
      }
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

export const useJobModalInit = ({
  fun,
  sourceId,
  templateId,
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
    setJsonFormValue({});
    setBaselineKwarg(undefined);
    setTtlValue(null);
    setTtlUnit("seconds");
  }, []);

  const initializeModal = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;
    setIsInitialLoading(true);
    resetLoadedData();

    try {
      const [masters, source] = await Promise.all([
        loadAcceptedMasters(),
        loadParamsSource(fun, sourceId, templateId, allowBuiltinSchemaFallback),
      ]);

      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      setMasterList(masters);
      setParamsSource(source);
      setJsonFormValue(getInitialJsonFormValue(source, initialJsonFormValue, arg, kwarg));
      setBaselineKwarg(getBaselineKwarg(source, kwarg));
      applyTtlFromInitialOrDefault(
        initialTtlSeconds,
        source.kind === "template" ? source.template.defaults?.ttl : source.schema.defaults?.ttl
      );

      form.resetFields();
      form.setFieldsValue({
        tgt: target,
        tgt_type: targetType,
        salt_master: defaultMaster || masters[0]?.value,
      });
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
      } else if (error instanceof Error && error.message === TEMPLATE_LOAD_FAILED_ERROR) {
        messageApi.error(t("task-create.error-loading-template"));
      } else {
        messageApi.error(acceptedMastersErrorMessage);
      }

      onLoadFailed();
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsInitialLoading(false);
      }
    }
  }, [
    allowBuiltinSchemaFallback,
    arg,
    acceptedMastersErrorMessage,
    applyTtlFromInitialOrDefault,
    defaultMaster,
    form,
    fun,
    initialJsonFormValue,
    initialTtlSeconds,
    kwarg,
    messageApi,
    navigate,
    onLoadFailed,
    renderWarningMessage,
    resetLoadedData,
    sourceId,
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
