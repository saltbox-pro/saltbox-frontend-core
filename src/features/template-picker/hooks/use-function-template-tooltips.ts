import { useCallback, useState } from "react";

import { apiCoreStore } from "saltbox-core/store";

import {
  buildFunctionTooltipData,
  type FunctionSchema,
  type FunctionTooltipData,
  type FunctionUiSchema,
} from "../helpers/function-tooltip";

export function useFunctionTemplateTooltips() {
  const [tooltipByFunction, setTooltipByFunction] = useState<Record<string, FunctionTooltipData>>(
    {}
  );
  const [loadingByFunction, setLoadingByFunction] = useState<Record<string, boolean>>({});
  const [resetCounter, setResetCounter] = useState(0);

  const resetTooltips = useCallback(() => {
    setTooltipByFunction({});
    setLoadingByFunction({});
    setResetCounter((prevState) => prevState + 1);
  }, []);

  const closeTooltips = useCallback(() => {
    setResetCounter((prevState) => prevState + 1);
  }, []);

  const loadTooltip = useCallback(
    (functionName: string) => {
      if (loadingByFunction[functionName]) {
        return;
      }

      const cachedTooltip = tooltipByFunction[functionName];
      if (cachedTooltip && !cachedTooltip.isLoadError) {
        return;
      }

      setLoadingByFunction((prevState) => ({ ...prevState, [functionName]: true }));

      apiCoreStore.jsonSchemasApi
        ?.jobsSchemasGet({ name: functionName })
        .then((result) => {
          setTooltipByFunction((prevState) => ({
            ...prevState,
            [functionName]: buildFunctionTooltipData(
              functionName,
              result?.json_schema as FunctionSchema,
              (result?.ui_schema ?? {}) as FunctionUiSchema
            ),
          }));
        })
        .catch(() => {
          setTooltipByFunction((prevState) => ({
            ...prevState,
            [functionName]: {
              name: functionName,
              arguments: [],
              isLoadError: true,
            },
          }));
        })
        .finally(() => {
          setLoadingByFunction((prevState) => ({ ...prevState, [functionName]: false }));
        });
    },
    [loadingByFunction, tooltipByFunction]
  );

  return {
    tooltipByFunction,
    loadingByFunction,
    resetCounter,
    loadTooltip,
    resetTooltips,
    closeTooltips,
  };
}
