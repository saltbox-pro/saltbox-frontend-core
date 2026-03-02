import { Drawer, type DrawerProps } from "@saltbox/saltbox-frontend-common";
import { PropsWithChildren, useEffect } from "react";

import { InfoDrawerError } from "./info-drawer-error";
import { InfoDrawerLink } from "./info-drawer-link";
import { InfoDrawerLoader } from "./info-drawer-loader";
import { InfoDrawerTitle } from "./info-drawer-title";

interface InfoDrawerProps
  extends
    PropsWithChildren,
    Pick<DrawerProps, "open" | "afterOpenChange" | "size" | "placement" | "title" | "extra"> {
  onClose: () => void;
  titleName?: string;
  titleLabel?: string;
  linkTo?: string;
  linkTitle?: string;
  errorMessage?: string | null;
  isLoading?: boolean;
  hasData?: boolean;
  onAfterClose?: () => void;
}

export function InfoDrawer({
  open,
  titleName,
  titleLabel,
  linkTo,
  linkTitle,
  errorMessage,
  isLoading,
  hasData = true,
  onClose,
  onAfterClose,
  children,
}: InfoDrawerProps) {
  const handleAfterOpenChange = (isOpen: boolean) => {
    if (!isOpen && onAfterClose) {
      onAfterClose();
    }
  };

  useEffect(() => {
    return () => {
      onClose();
      onAfterClose?.();
    };
  }, [onAfterClose, onClose]);

  const hasError = !isLoading && !!errorMessage;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="large"
      placement="right"
      title={<InfoDrawerTitle name={titleName} label={titleLabel} />}
      extra={<InfoDrawerLink to={linkTo} title={linkTitle} />}
      afterOpenChange={handleAfterOpenChange}
    >
      {isLoading && <InfoDrawerLoader />}

      {hasData && !hasError && !isLoading
        ? children
        : hasError && <InfoDrawerError message={errorMessage} />}
    </Drawer>
  );
}
