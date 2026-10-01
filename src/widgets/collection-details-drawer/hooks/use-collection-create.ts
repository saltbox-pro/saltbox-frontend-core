import type { CollectionModel } from "@saltbox/saltbox-core-api-client";
import { type AppError, runMutation } from "@saltbox/saltbox-frontend-common";
import type { FormInstance } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { isDuplicateTitleError } from "saltbox-core/shared/helpers/is-duplicate-title-error";
import { collectionsTreeStore } from "saltbox-core/store";

import type { CollectionEditFormType } from "../types";

interface UseCollectionCreateParams {
  form: FormInstance<CollectionEditFormType>;
  resolveQuery: () => object | null;
  onError: (error: AppError | null) => void;
  onCreated: (collection: CollectionModel) => void;
}

export function useCollectionCreate({
  form,
  resolveQuery,
  onError,
  onCreated,
}: UseCollectionCreateParams) {
  const { t } = useTranslation();

  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    let values: CollectionEditFormType;
    try {
      values = await form.validateFields(["title", "description", "parent_slug"]);
    } catch {
      return;
    }

    const query = resolveQuery();
    if (!query) {
      return;
    }

    setIsCreating(true);
    onError(null);

    const result = await runMutation({
      run: () =>
        collectionsTreeStore.createCollection({
          title: values.title,
          description: values.description?.trim() || undefined,
          query,
          parent_slug: values.parent_slug,
        }),
      successMessage: t("collection-create-modal.success"),
      onError: (error) => {
        if (isDuplicateTitleError(error)) {
          form.setFields([
            { name: "title", errors: [t("collection-create-modal.error-duplicate-title")] },
          ]);
          return;
        }
        onError(error);
      },
    });

    setIsCreating(false);
    if (!result.ok) return;

    onCreated(result.data);
  }, [form, resolveQuery, onError, onCreated, t]);

  return { handleCreate, isCreating };
}
