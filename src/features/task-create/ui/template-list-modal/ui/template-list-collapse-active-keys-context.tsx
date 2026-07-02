import { createContext, useContext, type ReactNode } from "react";

const TemplateListCollapseActiveKeysContext = createContext<string[]>([]);

export function TemplateListCollapseActiveKeysProvider({
  activeKeys,
  children,
}: {
  activeKeys: string[];
  children: ReactNode;
}) {
  return (
    <TemplateListCollapseActiveKeysContext.Provider value={activeKeys}>
      {children}
    </TemplateListCollapseActiveKeysContext.Provider>
  );
}

export function useTemplateListCollapseActiveKeys() {
  return useContext(TemplateListCollapseActiveKeysContext);
}
