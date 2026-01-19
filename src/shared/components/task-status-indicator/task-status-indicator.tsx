import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  StopOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { TaskStatus } from "@saltbox/saltbox-core-api-client";
import { Skeleton, Spin } from "antd";
import { useTranslation } from "react-i18next";

export const TaskStatusIndicator = ({ status }: { status?: TaskStatus | "none" }) => {
  const { t } = useTranslation();

  switch (status) {
    case TaskStatus.Created:
      return (
        <span>
          <ClockCircleOutlined /> {t("task.created")}
        </span>
      );
    case TaskStatus.Finished:
      return (
        <>
          <CheckCircleOutlined /> {t("task.finished")}
        </>
      );
    case TaskStatus.Running:
      return (
        <span>
          <Spin indicator={<SyncOutlined spin />} size="small" /> {t("task.running")}
        </span>
      );
    case TaskStatus.Stopping:
      return (
        <span>
          <Spin indicator={<SyncOutlined spin />} size="small" /> {t("task.stopping")}
        </span>
      );
    case TaskStatus.Stopped:
      return (
        <span>
          <StopOutlined /> {t("task.stopped")}
        </span>
      );
    case TaskStatus.WaitMinions:
      return (
        <span>
          <Spin indicator={<SyncOutlined spin />} size="small" /> {t("task.wait-minions")}
        </span>
      );
    case "none":
      return (
        <span>
          <QuestionCircleOutlined /> {t("task.unknown")}
        </span>
      );
    default:
      return <Skeleton.Input size="small" />;
  }
};
