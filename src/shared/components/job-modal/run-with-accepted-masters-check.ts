import { message } from "antd";
import type { TFunction } from "i18next";

import { mastersStore } from "saltbox-core/store";

export const runWithAcceptedMastersCheck = (t: TFunction, onSuccess: () => void): void => {
  mastersStore
    .hasAcceptedMasters()
    .then((hasMasters) => {
      if (!hasMasters) {
        message.warning(t("job-modal.warning-message"));
        return;
      }
      onSuccess();
    })
    .catch(() => {
      message.error(t("job-modal.error-load-salt-masters"));
    });
};
