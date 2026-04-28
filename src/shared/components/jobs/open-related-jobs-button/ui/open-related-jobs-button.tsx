import { ExportOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { type ButtonProps, Button, Space, Tooltip } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { escapeRegExp } from "../helpers/escape";

export type OpenRelatedJobsButtonProps = {
  sourceId: string;
  sourceType?: "task" | "policy" | "scheduler" | "scenario";
  buttonProps?: Omit<ButtonProps, "onClick" | "children" | "icon">;
  label?: string;
};

export function OpenRelatedJobsButton({
  buttonProps,
  label,
  sourceId,
  sourceType,
}: OpenRelatedJobsButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const tooltipTitle = useMemo(() => {
    switch (sourceType) {
      case "task":
        return t("jobs.open-related-tooltip-task");
      case "policy":
        return t("jobs.open-related-tooltip-policy");
      case "scheduler":
        return t("jobs.open-related-tooltip-scheduler");
      case "scenario":
        return t("jobs.open-related-tooltip-scenario");
      default:
        return "";
    }
  }, [t, sourceType]);

  const mongoQuery = useMemo(() => {
    if (sourceType === "scenario") {
      return {
        "source.id": { $regex: `^${escapeRegExp(sourceId)}` },
      };
    }
    return {
      "source.id": sourceId,
    };
  }, [sourceId, sourceType]);

  const handleClick = () => {
    navigate("/core/jobs", { state: mongoQuery });
  };

  return (
    <Space>
      <Button {...buttonProps} icon={<ExportOutlined />} onClick={handleClick}>
        {label ?? t("jobs.open-related")}
      </Button>

      <Tooltip title={tooltipTitle}>
        <QuestionCircleOutlined style={{ color: "#8c8c8c", cursor: "help" }} />
      </Tooltip>
    </Space>
  );
}
