import type {
  ExtraDataCategoryModel,
  MinionExtraDataCategoryField,
} from "@saltbox/saltbox-core-api-client";
import { MutationErrorAlert } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { useCallback } from "react";

import { useDeleteExtraDataCategoryFieldConfirm } from "../hooks/use-delete-extra-data-category-field-confirm";
import { useExtraDataCategoryFieldsManager } from "../hooks/use-extra-data-category-fields-manager";

import { ExtraDataCategoryFieldsList } from "./extra-data-category-fields-list";

type ExtraDataCategoryFieldsManagerProps = {
  category: ExtraDataCategoryModel;
  onSuccess?: (category: ExtraDataCategoryModel) => void;
};

export function ExtraDataCategoryFieldsManager({
  category,
  onSuccess,
}: ExtraDataCategoryFieldsManagerProps) {
  const { openConfirm, modalContextHolder } = useDeleteExtraDataCategoryFieldConfirm();

  const {
    createField,
    deleteField,
    reorderField,
    isCreating,
    isDeleting,
    isReordering,
    mutationError,
    mutationErrorFallback,
    resetMutationError,
  } = useExtraDataCategoryFieldsManager({ category, onSuccess });

  const handleDelete = useCallback(
    (field: MinionExtraDataCategoryField) => {
      openConfirm(field.name, () => deleteField(field.name));
    },
    [deleteField, openConfirm]
  );

  const isStructuralBusy = isCreating || isDeleting;

  return (
    <>
      <Flex vertical gap="small">
        <MutationErrorAlert
          error={mutationError}
          fallback={mutationErrorFallback}
          onClose={resetMutationError}
        />

        <ExtraDataCategoryFieldsList
          fields={category.fields}
          sortable
          dragDisabled={isStructuralBusy || isReordering}
          deleteDisabled={isStructuralBusy}
          createLoading={isCreating}
          createDisabled={isDeleting}
          onReorder={reorderField}
          onDelete={handleDelete}
          onCreate={(values) => createField(values)}
        />
      </Flex>

      {modalContextHolder}
    </>
  );
}
