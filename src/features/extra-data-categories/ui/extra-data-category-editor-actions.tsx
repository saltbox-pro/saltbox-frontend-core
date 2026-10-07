import { Button, Flex } from "antd";
import { useTranslation } from "react-i18next";

import { ActionButtonWithTooltip } from "saltbox-core/shared/components/action-button-with-tooltip";

type ExtraDataCategoryEditorActionsProps = {
  hasChanges: boolean;
  isSaving: boolean;
  onReset: () => void;
};

export function ExtraDataCategoryEditorActions({
  hasChanges,
  isSaving,
  onReset,
}: ExtraDataCategoryEditorActionsProps) {
  const { t } = useTranslation();

  return (
    <Flex gap="small">
      <Button onClick={onReset} disabled={!hasChanges || isSaving}>
        {t("common.reset")}
      </Button>
      <ActionButtonWithTooltip disabled={!hasChanges} title={t("common.no-changes-to-save")}>
        <Button type="primary" htmlType="submit" loading={isSaving} disabled={!hasChanges}>
          {t("common.save")}
        </Button>
      </ActionButtonWithTooltip>
    </Flex>
  );
}
