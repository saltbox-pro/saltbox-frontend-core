import { DeleteOutlined } from "@ant-design/icons";
import { Button, Flex } from "antd";
import { useTranslation } from "react-i18next";

import { useDeletePillar } from "../hooks/use-delete-pillar";
import { PillarDeleteConfirmModal } from "./pillar-delete-confirm-modal";

export interface PillarDeleteBlockProps {
  pillarId: string | null | undefined;
  pillarName: string | null | undefined;
  onDeleted?: () => void;
}

export function PillarDeleteBlock({ pillarId, pillarName, onDeleted }: PillarDeleteBlockProps) {
  const { t } = useTranslation();

  const deleteState = useDeletePillar({ pillarId, pillarName, onDeleted });

  return (
    <>
      <Flex justify="end">
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={deleteState.openModal}
          disabled={!pillarId}
        >
          {t("common.delete")}
        </Button>
      </Flex>

      <PillarDeleteConfirmModal
        open={deleteState.isOpen}
        onCancel={deleteState.closeModal}
        onConfirm={deleteState.handleDelete}
        confirmLoading={deleteState.isDeleting}
        pillarName={pillarName}
      />
    </>
  );
}
