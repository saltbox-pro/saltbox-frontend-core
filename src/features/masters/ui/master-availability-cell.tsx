import { Skeleton, Tag, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import type { MasterAvailability } from "../helpers/map-master-ping-result";

type MasterAvailabilityCellProps = {
  isAccepted: boolean;
  isPinging: boolean;
  availability?: MasterAvailability;
};

export function MasterAvailabilityCell({
  isAccepted,
  isPinging,
  availability,
}: MasterAvailabilityCellProps) {
  const { t } = useTranslation();

  if (!isAccepted) {
    return null;
  }

  if (isPinging) {
    return <Skeleton.Button active size="small" style={{ width: 72, minWidth: 72 }} />;
  }

  if (!availability) {
    return null;
  }

  if (availability.status === "available") {
    return <Tag color="green">{t("masters.availability-available")}</Tag>;
  }

  const tag = <Tag color="red">{t("masters.availability-unavailable")}</Tag>;

  if (!availability.error) {
    return tag;
  }

  return <Tooltip title={availability.error}>{tag}</Tooltip>;
}
