import type {
  TaskTargetingMasterSchema,
  TaskTargetingMastersBody,
} from "@saltbox/saltbox-core-api-client";
import { createLoader, type LoadSource } from "@saltbox/saltbox-frontend-common";
import { useEffect, useMemo, useState } from "react";

import {
  summarizeTargetingMasters,
  type TargetingSummary,
} from "../helpers/summarize-targeting-masters";
import { taskCreationService } from "../service";

type UseTaskTargetingMastersResult = {
  masters: Array<TaskTargetingMasterSchema>;
  loader: LoadSource;
  isLoaded: boolean;
  summary: TargetingSummary;
};

export function useTaskTargetingMasters(
  body: TaskTargetingMastersBody
): UseTaskTargetingMastersResult {
  const [masters, setMasters] = useState<Array<TaskTargetingMasterSchema>>([]);

  const [loader] = useState(() =>
    createLoader({
      run: (requestBody: TaskTargetingMastersBody) =>
        taskCreationService.loadTargetingMasters(requestBody),
      onSuccess: setMasters,
    })
  );

  useEffect(() => {
    loader.run(body).catch(() => undefined);
  }, [body, loader]);

  const isLoaded = loader.status === "success";

  const summary = useMemo(
    () => summarizeTargetingMasters(isLoaded ? masters : []),
    [isLoaded, masters]
  );

  return { masters, loader, isLoaded, summary };
}
