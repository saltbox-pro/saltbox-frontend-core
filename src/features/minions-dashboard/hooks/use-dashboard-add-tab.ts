import { useState } from "react";

import { TabNameError } from "../model/dashboard-model";
import { dashboardStore } from "../model/dashboard-store";

export type DashboardAddTabValues = {
  name: string;
  local: boolean;
};

export const useDashboardAddTab = () => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [error, setError] = useState<TabNameError | null>(null);

  const openAt = (element: HTMLElement | null) => {
    setAnchor(element);
    setError(null);
  };

  const close = () => {
    setAnchor(null);
    setError(null);
  };

  const submit = ({ name, local }: DashboardAddTabValues) => {
    const nextError = dashboardStore.addTab(name, local);
    if (nextError) {
      setError(nextError);
      return;
    }
    close();
  };

  const clearError = () => {
    setError(null);
  };

  return { anchor, error, openAt, close, submit, clearError };
};
