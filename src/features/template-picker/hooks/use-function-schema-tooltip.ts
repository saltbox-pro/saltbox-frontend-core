import { useCallback, useRef, useState } from "react";

import { apiCoreStore } from "saltbox-core/store";

import {
  buildFunctionTooltipData,
  type FunctionSchema,
  type FunctionTooltipData,
  type FunctionUiSchema,
} from "../helpers/function-tooltip";

export function useFunctionSchemaTooltip(functionName: string) {
  const [data, setData] = useState<FunctionTooltipData>();
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);

  const load = useCallback(() => {
    if (isLoadingRef.current || (data && !data.isLoadError)) {
      return;
    }

    const request = apiCoreStore.jsonSchemasApi?.jobsSchemasGet({ name: functionName });

    if (!request) {
      setData({ name: functionName, arguments: [], isLoadError: true });
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);

    request
      .then((result) => {
        setData(
          buildFunctionTooltipData(
            functionName,
            result?.json_schema as FunctionSchema,
            (result?.ui_schema ?? {}) as FunctionUiSchema
          )
        );
      })
      .catch(() => {
        setData({ name: functionName, arguments: [], isLoadError: true });
      })
      .finally(() => {
        isLoadingRef.current = false;
        setIsLoading(false);
      });
  }, [data, functionName]);

  return { data, isLoading, load };
}
