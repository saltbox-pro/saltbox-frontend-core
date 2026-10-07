import { type DragEvent, useState } from "react";

type DropSide = "before" | "after";

type UseExtraDataCategoryFieldsDragParams = {
  fieldNames: readonly string[];
  enabled?: boolean;
  onReorder: (fromName: string, toName: string) => void;
};

export function useExtraDataCategoryFieldsDrag({
  fieldNames,
  enabled = true,
  onReorder,
}: UseExtraDataCategoryFieldsDragParams) {
  const [draggedFieldName, setDraggedFieldName] = useState<string | null>(null);
  const [overFieldName, setOverFieldName] = useState<string | null>(null);

  const reset = () => {
    setDraggedFieldName(null);
    setOverFieldName(null);
  };

  const getDropSide = (fieldName: string): DropSide | null => {
    if (!draggedFieldName || draggedFieldName === fieldName || overFieldName !== fieldName) {
      return null;
    }

    return fieldNames.indexOf(draggedFieldName) < fieldNames.indexOf(fieldName)
      ? "after"
      : "before";
  };

  const getHandleDragProps = (fieldName: string) => ({
    draggable: enabled,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      if (!enabled) return;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", fieldName);
      setDraggedFieldName(fieldName);
    },
    onDragEnd: reset,
  });

  const getItemDropProps = (fieldName: string) => ({
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!enabled || !draggedFieldName) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setOverFieldName((current) => (current === fieldName ? current : fieldName));
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (!enabled || !draggedFieldName) {
        reset();
        return;
      }

      if (draggedFieldName !== fieldName) {
        onReorder(draggedFieldName, fieldName);
      }
      reset();
    },
  });

  return {
    draggedFieldName,
    getDropSide,
    getHandleDragProps,
    getItemDropProps,
  };
}
