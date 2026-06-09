import { SyncOutlined } from "@ant-design/icons";
import type { SourceOperation } from "@saltbox/saltbox-core-api-client";
import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import { getSourceOperationLabelKey } from "../../shared/constants/source-operations";

import styles from "./source-operation-spinner.module.css";

type SourceOperationSpinnerProps = {
  operation: SourceOperation;
  visible: boolean;
};

export function SourceOperationSpinner({ operation, visible }: SourceOperationSpinnerProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <span className={styles.spinner}>
      <Tooltip
        title={t(
          getSourceOperationLabelKey(operation) ??
            "configuration-templates.source.operation.unknown"
        )}
      >
        <SyncOutlined spin />
      </Tooltip>
    </span>
  );
}
