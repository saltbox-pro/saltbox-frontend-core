import { message } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { createElement } from "react";

import { AcceptedMastersWarningMessage } from "./accepted-masters-warning-message";
import { checkHasAcceptedMasters } from "./check-has-accepted-masters";

type WithAcceptedMastersCheckParams = {
  warningActionText: string;
  errorMessage: string;
  onSuccess: () => void | Promise<void>;
  onMastersClick?: () => void;
  messageApi?: MessageInstance;
};

export function showAcceptedMastersWarning(
  action: string,
  messageApi: MessageInstance = message,
  onMastersClick?: () => void
): void {
  messageApi.warning(createElement(AcceptedMastersWarningMessage, { action, onMastersClick }));
}

export async function withAcceptedMastersCheck({
  warningActionText,
  errorMessage,
  onSuccess,
  onMastersClick,
  messageApi,
}: WithAcceptedMastersCheckParams): Promise<void> {
  const resolvedMessageApi = messageApi ?? message;
  try {
    const hasMasters = await checkHasAcceptedMasters();

    if (!hasMasters) {
      showAcceptedMastersWarning(warningActionText, resolvedMessageApi, onMastersClick);
      return;
    }

    await onSuccess();
  } catch {
    resolvedMessageApi.error(errorMessage);
  }
}
