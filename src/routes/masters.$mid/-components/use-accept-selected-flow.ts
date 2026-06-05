import { SaltKeyMinion } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { RowSelectionState } from "@tanstack/react-table";
import { message, Modal } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore, SaltKeysStore } from "saltbox-core/store";

type ModalApi = ReturnType<typeof Modal.useModal>[0];
type MessageApi = ReturnType<typeof message.useMessage>[0];

type UseAcceptSelectedFlowParams = {
  saltKeysStore: SaltKeysStore;
  selection: RowSelectionState;
  modalApi: ModalApi;
  messageApi: MessageApi;
  setSelection: (selection: RowSelectionState) => void;
  isSendingAction: boolean;
  setIsSendingAction: (isSending: boolean) => void;
};

export function useAcceptSelectedFlow({
  saltKeysStore,
  selection,
  modalApi,
  messageApi,
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
      try {
        const response = await apiCoreStore.saltKeysApi?.saltKeysAccept({
          SaltKeySetStatusRequestBody: { minions },
        });
        onSuccess(response?.minions?.length ?? minions.length);
      } catch (error) {
        console.error("Failed to accept selected salt keys:", error);
        if (isGlobalServerError(error)) return;
        messageApi.error(t("master.accept-selected-failed"));
      } finally {
        setIsSendingAction(false);
        setSelection({});
        saltKeysStore.refresh();
        closeModals();
      }
    },
    [closeModals, messageApi, saltKeysStore, setIsSendingAction, setSelection, t]
  );

  const handleAcceptSelected = useCallback(() => {
    if (Object.keys(selection).length === 0) return;

    modalApi.confirm({
      title: t("master.accept-selected-confirm-title"),
      content: t("master.accept-selected-confirm-description", {
        count: Object.keys(selection).length,
      }),
      icon: null,
      okText: t("common.yes"),
      cancelText: t("common.no"),
      okButtonProps: { loading: isSendingAction },
      onOk: async () => {
        const selectedKeys = saltKeysStore.allSaltKeys.filter((key) => selection[key._index]);
        const { conflictMinions: conflicts, nonConflictMinions: nonConflicts } =
          saltKeysStore.getAcceptConflicts(selectedKeys);

        if (conflicts.length === 0) {
          await runAccept(nonConflicts, (acceptedCount) => {
            messageApi.success(t("master.accept-selected-success", { count: acceptedCount }));
          });
          return;
        }

        setConflictMinions(conflicts);
        setNonConflictMinions(nonConflicts);
        setConflictModalOpen(true);
      },
    });
  }, [isSendingAction, messageApi, modalApi, runAccept, saltKeysStore, selection, t]);

  const handleReplaceAll = useCallback(() => {
    runAccept([...nonConflictMinions, ...conflictMinions], () => {
      if (nonConflictMinions.length > 0) {
        messageApi.success(
          t("master.accept-mixed-success", {
            accepted: nonConflictMinions.length,
            replaced: conflictMinions.length,
          })
        );
      } else {
        messageApi.success(
          t("master.accept-replaced-success", { replaced: conflictMinions.length })
        );
      }
    });
  }, [conflictMinions, messageApi, nonConflictMinions, runAccept, t]);

  const handleCancelAccept = useCallback(() => {
    closeModals();
    setSelection({});
    messageApi.info(t("master.accept-cancelled"));
  }, [closeModals, messageApi, setSelection, t]);

  const handleAskEach = useCallback(() => {
    setConflictModalOpen(false);
    setPerKeyModalOpen(true);
  }, []);

  const handlePerKeyComplete = useCallback(
    (toReplace: SaltKeyMinion[]) => {
      const replaced = toReplace.length;
      const skipped = conflictMinions.length - replaced;
      const minions = [...nonConflictMinions, ...toReplace];

      const notify = () =>
        messageApi.success(
          t("master.accept-per-key-result", {
            accepted: nonConflictMinions.length,
            replaced,
            skipped,
          })
        );

      if (minions.length === 0) {
        closeModals();
        setSelection({});
        notify();
        return;
      }

      runAccept(minions, notify);
    },
    [
      closeModals,
      conflictMinions.length,
      messageApi,
      nonConflictMinions,
      runAccept,
      setSelection,
      t,
    ]
  );

  return {
    handleAcceptSelected,
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
