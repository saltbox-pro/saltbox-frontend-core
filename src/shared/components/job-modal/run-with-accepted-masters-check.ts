import type { TFunction } from "i18next";

import {
  ACCEPTED_MASTERS_ERROR_MESSAGE_KEY,
  withAcceptedMastersCheck,
} from "saltbox-core/shared/components/accepted-masters";

type RunWithAcceptedMastersCheckParams = {
  t: TFunction;
  warningActionText: string;
  onSuccess: () => void | Promise<void>;
  errorMessage?: string;
  onMastersClick?: () => void;
};

export const runWithAcceptedMastersCheck = ({
  t,
  warningActionText,
  onSuccess,
  errorMessage,
  onMastersClick,
}: RunWithAcceptedMastersCheckParams): void => {
  withAcceptedMastersCheck({
    warningActionText,
    errorMessage: errorMessage ?? t(ACCEPTED_MASTERS_ERROR_MESSAGE_KEY),
    onSuccess,
    onMastersClick,
  });
};
