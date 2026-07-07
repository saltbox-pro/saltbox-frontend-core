import type {
  CreateJobRequest,
  CreateJobRequestTgtTypeEnum,
  JobSchemaModel,
  MasterViewSchema,
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

type UseJobModalInitParams = {
  fun: string;
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

export const useJobModalInit = ({
  fun,
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
  const [saltFunction, setSaltFunction] = useState<JobSchemaModel>();
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
    setSaltFunction(undefined);
    setJsonFormValue({});
    setTtlValue(null);
    setTtlUnit("seconds");
  }, []);

  const initializeModal = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;
    setIsInitialLoading(true);
    resetLoadedData();

    try {
      const [masters, schema] = await Promise.all([
        loadAcceptedMasters(),
        fetchJobFunctionSchema(fun, (name) =>
          apiCoreStore.jsonSchemasApi?.jobsSchemasGet({ name })
        ),
      ]);

      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      const hasBaselineArgs = hasBaselineJobArgs(arg, kwarg);

      setMasterList(masters);
      setSaltFunction(schema);
      setJsonFormValue(
        hasBaselineArgs
          ? getRepeatJsonFormValue(arg, kwarg)
          : getDefaultJsonFormValue(schema.json_schema)
      );
      applyTtlFromInitialOrDefault(initialTtlSeconds, schema.default_ttl);

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
    initialTtlSeconds,
    kwarg,
    messageApi,
    navigate,
    onLoadFailed,
    renderWarningMessage,
    resetLoadedData,
    t,
    target,
    targetType,
  ]);

  const cancelInit = useCallback(() => {
    loadRequestIdRef.current += 1;
  }, []);

  return {
    isInitialLoading,
    isFormReady: !isInitialLoading && saltFunction != null,
    masterList,
    saltFunction,
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
