import { SaltKeyMinion } from "@saltbox/saltbox-core-api-client";
import { notify, runMutation } from "@saltbox/saltbox-frontend-common";
import { RowSelectionState } from "@tanstack/react-table";
import { Modal } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { acceptSaltKeys } from "saltbox-core/routes/masters.$mid/-api/salt-keys-actions";
import { SaltKeysStore, type SaltKeyWithId } from "saltbox-core/store";

type ModalApi = ReturnType<typeof Modal.useModal>[0];

type UseAcceptSelectedFlowParams = {
  saltKeysStore: SaltKeysStore;
  modalApi: ModalApi;
  setSelection: (selection: RowSelectionState) => void;
  isSendingAction: boolean;
  setIsSendingAction: (isSending: boolean) => void;
};

export function useAcceptSelectedFlow({
  saltKeysStore,
  modalApi,
  setSelection,
  isSendingAction,
  setIsSendingAction,
}: UseAcceptSelectedFlowParams) {
  const { t } = useTranslation();

  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [perKeyModalOpen, setPerKeyModalOpen] = useState(false);
  const [conflictMinions, setConflictMinions] = useState<SaltKeyMinion[]>([]);
  const [nonConflictMinions, setNonConflictMinions] = useState<SaltKeyMinion[]>([]);

  const closeModals = useCallback(() => {
    setConflictModalOpen(false);
    setPerKeyModalOpen(false);
  }, []);

  const runAccept = useCallback(
    async (minions: SaltKeyMinion[], onSuccess: (acceptedCount: number) => void) => {
      setIsSendingAction(true);

      const result = await runMutation({
        run: () => acceptSaltKeys(minions),
        errorMessage: t("master.accept-selected-failed"),
      });

      if (result.ok) {
        onSuccess(result.data?.minions?.length ?? minions.length);
      }

      setIsSendingAction(false);
      setSelection({});
      saltKeysStore.refresh();
      closeModals();
    },
    [closeModals, saltKeysStore, setIsSendingAction, setSelection, t]
  );

  const handleAcceptKeys = useCallback(
    (keys: SaltKeyWithId[]) => {
      if (keys.length === 0) return;

      modalApi.confirm({
        title: t("master.accept-selected-confirm-title"),
        content: t("master.accept-selected-confirm-description", {
          count: keys.length,
        }),
        icon: null,
        okText: t("common.yes"),
        cancelText: t("common.no"),
        okButtonProps: { loading: isSendingAction },
        onOk: async () => {
          const { conflictMinions: conflicts, nonConflictMinions: nonConflicts } =
            saltKeysStore.getAcceptConflicts(keys);

          if (conflicts.length === 0) {
            await runAccept(nonConflicts, (acceptedCount) => {
              notify.success(t("master.accept-selected-success", { count: acceptedCount }));
            });
            return;
          }

          setConflictMinions(conflicts);
          setNonConflictMinions(nonConflicts);
          setConflictModalOpen(true);
        },
      });
    },
    [isSendingAction, modalApi, runAccept, saltKeysStore, t]
  );

  const handleReplaceAll = useCallback(() => {
    runAccept([...nonConflictMinions, ...conflictMinions], () => {
      if (nonConflictMinions.length > 0) {
        notify.success(
          t("master.accept-mixed-success", {
            accepted: nonConflictMinions.length,
            replaced: conflictMinions.length,
          })
        );
      } else {
        notify.success(t("master.accept-replaced-success", { replaced: conflictMinions.length }));
      }
    });
  }, [conflictMinions, nonConflictMinions, runAccept, t]);

  const handleCancelAccept = useCallback(() => {
    closeModals();
    setSelection({});
    notify.info(t("master.accept-cancelled"));
  }, [closeModals, setSelection, t]);

  const handleAskEach = useCallback(() => {
    setConflictModalOpen(false);
    setPerKeyModalOpen(true);
  }, []);

  const handlePerKeyComplete = useCallback(
    (toReplace: SaltKeyMinion[]) => {
      const replaced = toReplace.length;
      const skipped = conflictMinions.length - replaced;
      const minions = [...nonConflictMinions, ...toReplace];

      const notifyResult = () =>
        notify.success(
          t("master.accept-per-key-result", {
            accepted: nonConflictMinions.length,
            replaced,
            skipped,
          })
        );

      if (minions.length === 0) {
        closeModals();
        setSelection({});
        notifyResult();
        return;
      }

      runAccept(minions, notifyResult);
    },
    [closeModals, conflictMinions.length, nonConflictMinions, runAccept, setSelection, t]
  );

  return {
    handleAcceptKeys,
    conflictModalProps: {
      open: conflictModalOpen,
      conflictCount: conflictMinions.length,
      isSending: isSendingAction,
      onReplaceAll: handleReplaceAll,
      onCancelAccept: handleCancelAccept,
      onAskEach: handleAskEach,
      onClose: () => setConflictModalOpen(false),
    },
    perKeyModalProps: {
      open: perKeyModalOpen,
      conflictMinions,
      isSending: isSendingAction,
      onComplete: handlePerKeyComplete,
      onClose: () => setPerKeyModalOpen(false),
    },
  };
}
