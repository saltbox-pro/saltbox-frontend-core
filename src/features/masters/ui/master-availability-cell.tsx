import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { StatusBadge } from "@saltbox/saltbox-frontend-common";
import { Skeleton, Tooltip } from "antd";
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
    return <Skeleton.Input size="small" active />;
  }

  if (!availability) {
    return null;
  }

  if (availability.status === "available") {
    return (
      <StatusBadge tone="success" icon={<CheckCircleOutlined />}>
        {t("masters.availability-available")}
      </StatusBadge>
    );
  }

  const badge = (
    <StatusBadge tone="danger" icon={<CloseCircleOutlined />}>
      {t("masters.availability-unavailable")}
    </StatusBadge>
  );

  if (!availability.error) {
    return badge;
  }

  return <Tooltip title={availability.error}>{badge}</Tooltip>;
}
