import { DragEvent, useState } from "react";

import { dashboardStore } from "../model/dashboard-store";

type DropSide = "before" | "after";

export const useDashboardTabDrag = (tabIds: string[]) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [overTabId, setOverTabId] = useState<string | null>(null);

  const reset = () => {
    setDraggedTabId(null);
    setOverTabId(null);
  };

  const getDropSide = (tabId: string): DropSide | null => {
    if (!draggedTabId || draggedTabId === tabId || overTabId !== tabId) {
      return null;
    }
    return tabIds.indexOf(draggedTabId) < tabIds.indexOf(tabId) ? "after" : "before";
  };

  const getDragProps = (tabId: string, enabled: boolean) => ({
    draggable: enabled,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", tabId);
      setDraggedTabId(tabId);
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!draggedTabId) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "move";
      setOverTabId(tabId);
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (draggedTabId) {
        dashboardStore.moveTab(draggedTabId, tabId);
      }
      reset();
    },
    onDragEnd: reset,
  });

  const lastTabId = tabIds[tabIds.length - 1] ?? null;

  const containerDragProps = {
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!draggedTabId || !lastTabId) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setOverTabId(lastTabId);
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (draggedTabId && lastTabId) {
        dashboardStore.moveTab(draggedTabId, lastTabId);
      }
      reset();
    },
  };

  return { draggedTabId, getDropSide, getDragProps, containerDragProps };
};
