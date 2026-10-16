import { createContext, useContext } from "react";

import type { ExtraDataCategoriesStore } from "saltbox-core/store";

export const ExtraDataCategoriesContext = createContext<ExtraDataCategoriesStore | null>(null);

export function useExtraDataCategoriesStore(): ExtraDataCategoriesStore {
  const store = useContext(ExtraDataCategoriesContext);
  if (!store) {
    throw new Error("ExtraDataCategoriesContext.Provider is required");
  }
  return store;
}
