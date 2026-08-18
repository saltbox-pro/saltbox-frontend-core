import type {
  CreateJobRequest,
  CreateJobRequestTgtTypeEnum,
  JobSchemaModel,
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
import {
  fetchJobFunctionSchema,
  getDefaultJsonFormValue,
  getRepeatJsonFormValue,
  hasBaselineJobArgs,
  parseTtlValue,
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
  | { kind: "function"; schema: JobSchemaModel };

type UseJobModalInitParams = {
  fun: string;
  sourceId?: string;
  templateId?: string;
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
  templateId?: string
): Promise<JobParamsSource> => {
  if (sourceId && templateId) {
    try {
      const template = await taskTemplateService.loadTemplateById(sourceId, templateId);
      return { kind: "template", template };
    } catch {
      throw new Error(TEMPLATE_LOAD_FAILED_ERROR);
    }
  }

  const schema = await fetchJobFunctionSchema(fun, (name) =>
    apiCoreStore.jsonSchemasApi?.jobsSchemasGet({ name })
  );

  return { kind: "function", schema };
};

const getInitialJsonFormValue = (
  source: JobParamsSource,
  initialJsonFormValue: Record<string, unknown> | undefined,
  arg: unknown[] | undefined,
  kwarg: Record<string, unknown> | undefined
): Record<string, unknown> => {
  if (source.kind === "template") {
    return initialJsonFormValue ?? getDefaultJsonFormValue(source.template.json_schema);
  }

  return hasBaselineJobArgs(arg, kwarg)
    ? getRepeatJsonFormValue(arg, kwarg, source.schema.json_schema)
    : getDefaultJsonFormValue(source.schema.json_schema);
};

export const useJobModalInit = ({
  fun,
  sourceId,
  templateId,
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
        loadParamsSource(fun, sourceId, templateId),
      ]);

      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      setMasterList(masters);
      setParamsSource(source);
      setJsonFormValue(getInitialJsonFormValue(source, initialJsonFormValue, arg, kwarg));
      applyTtlFromInitialOrDefault(
        initialTtlSeconds,
        source.kind === "template" ? source.template.defaults?.ttl : source.schema.default_ttl
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
      } else if (error instanceof Error && error.message === "JOB_SCHEMA_LOAD_FAILED") {
        messageApi.error(t("job-modal.error-load-function-schema"));
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
    ttlValue,
    setTtlValue,
    ttlUnit,
    setTtlUnit,
    initializeModal,
    resetLoadedData,
    cancelInit,
  };
};
