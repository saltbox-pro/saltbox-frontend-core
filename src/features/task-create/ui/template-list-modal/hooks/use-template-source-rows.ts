import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import type { MessageInstance } from "antd/es/message/interface";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TemplateSourceRow } from "../../../helpers/template-picker-rows";
import { taskTemplateService } from "../../../service";

type UseTemplateSourceRowsParams = {
  isOpen: boolean;
  messageApi: MessageInstance;
};

export function useTemplateSourceRows({ isOpen, messageApi }: UseTemplateSourceRowsParams) {
  const { t } = useTranslation();
  const [sourceRows, setSourceRows] = useState<TemplateSourceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const reset = useCallback(() => {
    setSourceRows([]);
    setIsLoading(false);
    setIsError(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      reset();
      return;
    }

    let isCancelled = false;

    const loadSourceRows = async () => {
      setIsError(false);
      setIsLoading(true);

      try {
        const loadedSourceRows = await taskTemplateService.loadTemplateSourceRows();
        if (!isCancelled) {
          setSourceRows(loadedSourceRows);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }
        if (!isGlobalServerError(error)) {
          messageApi.error(t("task-create.error-loading-templates"));
        }
        setIsError(true);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSourceRows();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, messageApi, reset, t]);

  return { sourceRows, setSourceRows, isLoading, isError };
}
