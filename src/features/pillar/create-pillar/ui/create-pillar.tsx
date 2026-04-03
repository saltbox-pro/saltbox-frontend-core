import { PlusOutlined } from "@ant-design/icons";
import { PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { Button } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { CreatePillarModal } from "./create-pillar-modal";

export interface CreatePillarProps {
  targetType: PillarTgtType;
  tgtId?: string;
  targetName?: string;
  loadPillars: () => void;
}

export function CreatePillar({ loadPillars, tgtId, targetName, targetType }: CreatePillarProps) {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
        {t("pillars.create.add-button")}
      </Button>

      <CreatePillarModal
        isOpen={isOpen}
        onClose={closeModal}
        loadPillars={loadPillars}
        targetName={targetName}
        tgtType={targetType}
        tgtId={tgtId}
      />
    </>
  );
}
