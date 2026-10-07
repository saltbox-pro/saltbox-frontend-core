import type {
  ExtraDataCategoryModel,
  MinionExtraDataCategoryFieldType,
} from "@saltbox/saltbox-core-api-client";
import { type AppError, runMutation } from "@saltbox/saltbox-frontend-common";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { createExtraDataCategoryField } from "../api/create-extra-data-category-field";
import { deleteExtraDataCategoryField } from "../api/delete-extra-data-category-field";
import { orderExtraDataCategoryFields } from "../api/order-extra-data-category-fields";
import {
  applyExtraDataCategoryFieldOrder,
  mergeExtraDataCategoryFieldsPreferringCurrentOrder,
  reorderExtraDataCategoryFieldByName,
} from "../helpers/extra-data-category-field-form";

type UseExtraDataCategoryFieldsManagerParams = {
  category: ExtraDataCategoryModel;
  onSuccess?: (category: ExtraDataCategoryModel) => void;
};

export function useExtraDataCategoryFieldsManager({
  category,
  onSuccess,
}: UseExtraDataCategoryFieldsManagerParams) {
  const { t } = useTranslation();
  const categoryRef = useRef(category);
  categoryRef.current = category;

  const mutationQueueRef = useRef(Promise.resolve());
  const isStructuralMutatingRef = useRef(false);
  const isReorderingRef = useRef(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [mutationError, setMutationError] = useState<AppError | null>(null);
  const [mutationErrorFallback, setMutationErrorFallback] = useState(() =>
    t("extra-data-categories.fields-manager.error")
  );

  const enqueueMutation = useCallback(<T>(task: () => Promise<T>): Promise<T> => {
    const run = mutationQueueRef.current.then(task, task);
    mutationQueueRef.current = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }, []);

  const resetMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  const createField = useCallback(
    async (params: { name: string; types: MinionExtraDataCategoryFieldType[] }) => {
      if (isStructuralMutatingRef.current) return false;
      isStructuralMutatingRef.current = true;
      setIsCreating(true);
      setMutationError(null);

      const fieldName = params.name.trim();
      setMutationErrorFallback(t("extra-data-categories.create-field.error", { name: fieldName }));

      try {
        return await enqueueMutation(async () => {
          const currentCategory = categoryRef.current;
          const result = await runMutation({
            run: () =>
              createExtraDataCategoryField({
                source: currentCategory.source,
                name: currentCategory.name,
                field: {
                  name: fieldName,
                  types: params.types,
                  is_minion_field: false,
                },
              }),
            successMessage: t("extra-data-categories.create-field.success", {
              name: fieldName,
            }),
            onError: setMutationError,
          });

          if (!result.ok) return false;

          const latest = categoryRef.current;
          onSuccess?.({
            ...result.data,
            fields: mergeExtraDataCategoryFieldsPreferringCurrentOrder(
              latest.fields,
              result.data.fields
            ),
            minion_fields: result.data.minion_fields ?? latest.minion_fields,
          });
          return true;
        });
      } finally {
        isStructuralMutatingRef.current = false;
        setIsCreating(false);
      }
    },
    [enqueueMutation, onSuccess, t]
  );

  const deleteField = useCallback(
    async (fieldName: string) => {
      if (isStructuralMutatingRef.current) return;
      isStructuralMutatingRef.current = true;
      setIsDeleting(true);
      setMutationError(null);
      setMutationErrorFallback(t("extra-data-categories.delete-field.error", { name: fieldName }));

      try {
        await enqueueMutation(async () => {
          const currentCategory = categoryRef.current;
          const result = await runMutation({
            run: () =>
              deleteExtraDataCategoryField({
                source: currentCategory.source,
                name: currentCategory.name,
                fieldName,
              }),
            successMessage: t("extra-data-categories.delete-field.success", { name: fieldName }),
            onError: setMutationError,
          });

          if (!result.ok) return;

          const latest = categoryRef.current;
          onSuccess?.({
            ...result.data,
            fields: mergeExtraDataCategoryFieldsPreferringCurrentOrder(
              latest.fields,
              result.data.fields
            ),
            minion_fields: result.data.minion_fields ?? latest.minion_fields,
          });
        });
      } finally {
        isStructuralMutatingRef.current = false;
        setIsDeleting(false);
      }
    },
    [enqueueMutation, onSuccess, t]
  );

  const reorderField = useCallback(
    async (fromName: string, toName: string) => {
      if (isReorderingRef.current) return;

      const previousCategory = categoryRef.current;
      const previousNames = (previousCategory.fields ?? []).map((field) => field.name);
      const nextFields = reorderExtraDataCategoryFieldByName(
        previousCategory.fields ?? [],
        fromName,
        toName
      );
      if (!nextFields) return;

      isReorderingRef.current = true;
      setIsReordering(true);
      setMutationError(null);

      onSuccess?.({
        ...previousCategory,
        fields: nextFields,
      });
      setMutationErrorFallback(t("extra-data-categories.order-fields.error"));

      try {
        await enqueueMutation(async () => {
          const currentCategory = categoryRef.current;
          const fieldNames = (currentCategory.fields ?? []).map((field) => field.name);

          const result = await runMutation({
            run: () =>
              orderExtraDataCategoryFields({
                source: currentCategory.source,
                name: currentCategory.name,
                fieldNames,
              }),
            successMessage: t("extra-data-categories.order-fields.success"),
            onError: setMutationError,
          });

          const latest = categoryRef.current;

          if (!result.ok) {
            onSuccess?.({
              ...latest,
              fields: applyExtraDataCategoryFieldOrder(latest.fields, previousNames),
            });
            return;
          }

          const serverNames = (result.data.fields ?? latest.fields ?? nextFields).map(
            (field) => field.name
          );
          onSuccess?.({
            ...latest,
            fields: applyExtraDataCategoryFieldOrder(latest.fields, serverNames),
            minion_fields: result.data.minion_fields ?? latest.minion_fields,
            modified: result.data.modified ?? latest.modified,
          });
        });
      } finally {
        isReorderingRef.current = false;
        setIsReordering(false);
      }
    },
    [enqueueMutation, onSuccess, t]
  );

  return {
    createField,
    deleteField,
    reorderField,
    isCreating,
    isDeleting,
    isReordering,
    mutationError,
    mutationErrorFallback,
    resetMutationError,
  };
}
