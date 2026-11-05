import type { CollectionDetailSchema } from "@saltbox/saltbox-core-api-client";
import type { FormInstance } from "antd";
import { useCallback, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { MinionFilterStore } from "saltbox-core/store";

import { buildDuplicateCreateDraft, buildEmptyCreateDraft } from "../helpers/create-draft";
import { getFilterStateKey } from "../helpers/get-filter-state-key";
import type {
  CollectionCreateDraft,
  CollectionDetailsDrawerOpenParams,
  CollectionEditFormType,
} from "../types";

interface UseCollectionCreateDraftParams {
  form: FormInstance<CollectionEditFormType>;
  filterStore: MinionFilterStore;
  openedArg: CollectionDetailsDrawerOpenParams | null;
  sourceCollection: CollectionDetailSchema | undefined;
}

type DraftState = {
  id: string;
  draft: CollectionCreateDraft;
  filtersBaselineKey: string;
  version: number;
};

export function useCollectionCreateDraft({
  form,
  filterStore,
  openedArg,
  sourceCollection,
}: UseCollectionCreateDraftParams) {
  const { t } = useTranslation();

  const [draftState, setDraftState] = useState<DraftState | null>(null);

  const draftId = openedArg && openedArg.mode !== "view" ? openedArg.id : null;
  const createParentSlug = openedArg?.mode === "create" ? openedArg.parentSlug : undefined;
  const isCreateMode = draftId !== null;
  const isDuplicateMode = openedArg?.mode === "duplicate";
  const readyState = isCreateMode && draftState?.id === draftId ? draftState : null;

  const applyDraft = useCallback(
    (id: string, draft: CollectionCreateDraft) => {
      form.setFields([
        { name: "title", value: draft.title, errors: [] },
        { name: "description", value: draft.description, errors: [] },
        { name: "parent_slug", value: draft.parent_slug, errors: [] },
      ]);
      filterStore.resetInputMode();
      filterStore.initializeByQuery(draft.query);
      const filtersBaselineKey = getFilterStateKey(filterStore);
      setDraftState((prev) => ({
        id,
        draft,
        filtersBaselineKey,
        version: (prev?.version ?? 0) + 1,
      }));
    },
    [form, filterStore]
  );

  useLayoutEffect(() => {
    if (!openedArg || openedArg.mode === "view") {
      setDraftState(null);
      return;
    }

    if (draftState?.id === openedArg.id) {
      return;
    }

    let draft: CollectionCreateDraft;
    if (openedArg.mode === "create") {
      draft = buildEmptyCreateDraft(openedArg.parentSlug);
    } else if (sourceCollection) {
      draft = buildDuplicateCreateDraft(sourceCollection, (title) =>
        t("collection.duplicate-title", { title })
      );
    } else {
      return;
    }

    applyDraft(openedArg.id, draft);
  }, [openedArg, draftState?.id, sourceCollection, applyDraft, t]);

  const resetCreateDraft = useCallback(() => {
    if (readyState) {
      applyDraft(readyState.id, readyState.draft);
    }
  }, [readyState, applyDraft]);

  return {
    isCreateMode,
    isDuplicateMode,
    isCreateFormReady: readyState !== null,
    createParentSlug,
    createDraft: readyState?.draft ?? null,
    createFiltersBaselineKey: readyState?.filtersBaselineKey,
    draftVersion: draftState?.version ?? 0,
    resetCreateDraft,
  };
}
