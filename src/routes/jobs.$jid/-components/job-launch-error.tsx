import { Alert, Typography } from "antd";
import { useTranslation } from "react-i18next";

import styles from "./job-launch-error.module.css";

const { Paragraph } = Typography;

const NO_MINIONS_FOUND = "no_minions_found";

const TOOLTIP_CLASS_NAMES = {
  root: styles.jobErrorTooltipRoot,
  body: styles.jobErrorTooltipBody,
};

interface JobLaunchErrorProps {
  launchErrorType?: string | null;
  target?: string;
}

export function JobLaunchError({ launchErrorType, target }: JobLaunchErrorProps) {
  const { t } = useTranslation();

  const description =
    launchErrorType === NO_MINIONS_FOUND && target
      ? t("jobs.launch-error-no-minions-found", { target })
      : t("jobs.launch-error-unknown");

  return (
    <Alert
      className={styles.jobErrorAlert}
      type="error"
      showIcon
      message={t("jobs.launch-error-title")}
      description={
        <Paragraph
          className={styles.jobErrorAlertDescription}
          ellipsis={{
            rows: 2,
            tooltip: {
              title: description,
              placement: "bottom",
              classNames: TOOLTIP_CLASS_NAMES,
            },
          }}
        >
          {description}
        </Paragraph>
      }
    />
  );
}
