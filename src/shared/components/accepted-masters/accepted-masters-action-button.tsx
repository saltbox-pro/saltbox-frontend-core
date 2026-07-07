import { type ButtonProps, Button } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { ACCEPTED_MASTERS_ERROR_MESSAGE_KEY } from "./constants";
import { withAcceptedMastersCheck } from "./with-accepted-masters-check";

export type AcceptedMastersActionButtonProps = Omit<ButtonProps, "onClick" | "loading"> & {
  onAction: () => void | Promise<void>;
  warningActionText: string;
  errorMessage?: string;
  loading?: boolean;
  messageApi?: MessageInstance;
};

export function AcceptedMastersActionButton({
  onAction,
  warningActionText,
  errorMessage,
  disabled,
  loading = false,
  messageApi,
  ...buttonProps
}: AcceptedMastersActionButtonProps) {
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();
  const resolvedErrorMessage = errorMessage ?? t(ACCEPTED_MASTERS_ERROR_MESSAGE_KEY);

  const handleClick = useCallback(() => {
    if (disabled || loading || isChecking) return;

    setIsChecking(true);

    withAcceptedMastersCheck({
      warningActionText,
      errorMessage: resolvedErrorMessage,
      onMastersClick: () => navigate("/core/masters"),
      onSuccess: onAction,
      messageApi,
    }).finally(() => {
      setIsChecking(false);
    });
  }, [
    disabled,
    isChecking,
    loading,
    messageApi,
    navigate,
    onAction,
    resolvedErrorMessage,
    warningActionText,
  ]);

  return (
    <Button
      {...buttonProps}
      disabled={disabled}
      loading={loading || isChecking}
      onClick={handleClick}
    />
  );
}
