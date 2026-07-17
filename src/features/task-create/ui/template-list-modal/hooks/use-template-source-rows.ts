import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import type { MessageInstance } from "antd/es/message/interface";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TemplateSourceRow } from "../../../helpers/template-picker-rows";
import { taskTemplateService } from "../../../service";

type UseTemplateSourceRowsParams = {
  messageApi: MessageInstance;
};

export function useTemplateSourceRows({ messageApi }: UseTemplateSourceRowsParams) {
  const { t } = useTranslation();
  const [sourceRows, setSourceRows] = useState<TemplateSourceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
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
  }, [messageApi, t]);

  return { sourceRows, setSourceRows, isLoading, isError };
}
