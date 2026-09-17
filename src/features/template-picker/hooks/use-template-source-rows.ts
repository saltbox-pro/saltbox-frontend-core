import { createLoader } from "@saltbox/saltbox-frontend-common";
import { useEffect, useState } from "react";

import type { TemplateSourceRow } from "../helpers/template-picker-rows";
import { templatePickerService } from "../service";

export function useTemplateSourceRows() {
  const [sourceRows, setSourceRows] = useState<TemplateSourceRow[]>([]);

  const [sourceRowsLoad] = useState(() =>
    createLoader({
      run: () => templatePickerService.loadTemplateSourceRows(),
      onSuccess: setSourceRows,
    })
  );

  useEffect(() => {
    sourceRowsLoad.run().catch(() => undefined);
  }, [sourceRowsLoad]);

  return { sourceRows, setSourceRows, isLoading: sourceRowsLoad.isLoading, sourceRowsLoad };
}
