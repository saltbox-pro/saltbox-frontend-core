import { createContext } from "react";

export interface TranslationDraftContextValue {
  values: Record<string, string>;
  onChange: (locale: string, value: string) => void;
}

export const TranslationDraftContext = createContext<TranslationDraftContextValue | null>(null);
