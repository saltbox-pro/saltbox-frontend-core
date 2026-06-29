import { MinusCircleOutlined } from "@ant-design/icons";
import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { Collapse, Steps, type StepsProps, Typography } from "antd";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

import { getShortJobReturnOutput } from "../utils/job-return-utils";
import {
  getSaltStepComment,
  getSaltStepError,
  getSaltStepStatus,
  getSaltStepTitle,
  matchSaltSkipReason,
  parseSaltStates,
  type SaltStateResult,
} from "../utils/salt-step-status";

import { JobReturnOutput } from "./job-return-output";
import styles from "./job-return-steps.module.css";

export interface JobReturnStepsProps {
  jobReturn?: JobReturnModel | null;
  inProcess?: boolean;
}

function StepHumanText({ state }: { state: SaltStateResult }) {
  const { t } = useTranslation();
  const status = getSaltStepStatus(state);

  if (status === "error") {
    const { text, retcode } = getSaltStepError(state);
    if (!text && typeof retcode !== "number") {
      return null;
    }

    return (
      <div>
        {text && <pre className={styles.errorText}>{text}</pre>}
        {typeof retcode === "number" && (
          <Typography.Text type="secondary" className={styles.retcode}>
            {t("job-return.step.return-code", { code: retcode })}
          </Typography.Text>
        )}
      </div>
    );
  }

  if (status === "skipped") {
    const reason = matchSaltSkipReason(state) ?? "generic";
    return (
      <Typography.Text type="secondary" className={styles.skipText}>
        {t(`job-return.step.skip-${reason}`)}
      </Typography.Text>
    );
  }

  const comment = getSaltStepComment(state);
  if (!comment) return null;

  return (
    <Typography.Text type="secondary" className={styles.defaultText}>
      {comment}
    </Typography.Text>
  );
}

function StepDescription({ state }: { state: SaltStateResult }) {
  const { t } = useTranslation();

  return (
    <div className={styles.description}>
      <StepHumanText state={state} />

      <Collapse
        ghost
        size="small"
        className={styles.technicalCollapse}
        items={[
          {
            key: "technical",
            label: t("job-return.step.technical-output"),
            children: (
              <ReactJson
                displayDataTypes={false}
                enableClipboard={false}
                name={false}
                displayObjectSize={false}
                src={state}
                collapsed={false}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

const STEP_ANTD_STATUS: Record<
  ReturnType<typeof getSaltStepStatus>,
  StepsProps["status"] | undefined
> = {
  success: "finish",
  error: "error",
  skipped: undefined,
};

export function JobReturnSteps({ jobReturn, inProcess }: JobReturnStepsProps) {
  const states = inProcess ? null : parseSaltStates(getShortJobReturnOutput(jobReturn));

  if (!states) {
    return <JobReturnOutput jobReturn={jobReturn} inProcess={inProcess} />;
  }

  const items: StepsProps["items"] = states.map((state, index) => {
    const stepStatus = getSaltStepStatus(state);
    const isSkipped = stepStatus === "skipped";

    return {
      key: `${state.__run_num__ ?? index}-${getSaltStepTitle(state) || index}`,
      status: STEP_ANTD_STATUS[stepStatus],
      icon: isSkipped ? <MinusCircleOutlined className={styles.skippedIcon} /> : undefined,
      title: (
        <span className={isSkipped ? styles.skippedTitle : undefined}>
          {getSaltStepTitle(state)}
        </span>
      ),
      description: <StepDescription state={state} />,
    };
  });

  return <Steps direction="vertical" size="small" items={items} className={styles.steps} />;
}
