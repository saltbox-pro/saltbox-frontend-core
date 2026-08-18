import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { taskTemplateService } from "saltbox-core/shared/services/task-template.service";

import { buildFunctionTooltipData, type FunctionTooltipData } from "../helpers/function-tooltip";

type UseTemplateSchemaTooltipParams = {
  sourceId: string;
  templateId: string;
  fun: string;
};

export function useTemplateSchemaTooltip({
  sourceId,
  templateId,
  fun,
}: UseTemplateSchemaTooltipParams) {
  const { i18n } = useTranslation();
  const [data, setData] = useState<FunctionTooltipData>();
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);

  const load = useCallback(() => {
    if (isLoadingRef.current || (data && !data.isLoadError)) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);

    taskTemplateService
      .loadTemplateById(sourceId, templateId)
      .then((template) => {
        setData(buildFunctionTooltipData(fun, template, i18n.language));
      })
      .catch(() => {
        setData({ name: fun, arguments: [], isLoadError: true });
      })
      .finally(() => {
        isLoadingRef.current = false;
        setIsLoading(false);
      });
  }, [data, fun, i18n.language, sourceId, templateId]);

  return { data, isLoading, load };
}
