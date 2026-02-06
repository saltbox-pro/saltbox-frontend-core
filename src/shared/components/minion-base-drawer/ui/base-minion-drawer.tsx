import { Drawer } from "@saltbox/saltbox-frontend-common";
import { useEffect, type ReactNode } from "react";

import { BaseMinionDrawerError } from "./base-minion-drawer-error";
import { BaseMinionDrawerLink } from "./base-minion-drawer-link";
import { BaseMinionDrawerLoader } from "./base-minion-drawer-loader";
import { BaseMinionDrawerTitle } from "./base-minion-drawer-title";

interface BaseMinionDrawerProps {
  innerId: string;
  id: string;
  slug: string | null | undefined;
  open: boolean;
  error?: string;
  isLoading?: boolean;
  hasData?: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
  children: ReactNode;
}

export function BaseMinionDrawer({
  innerId,
  id,
  slug,
  open,
  error,
  isLoading,
  hasData = true,
  onClose,
  onAfterClose,
  children,
}: BaseMinionDrawerProps) {
  const handleAfterOpenChange = (isOpen: boolean) => {
    if (!isOpen && onAfterClose) {
      onAfterClose();
    }
  };

  useEffect(() => {
    return () => {
      onClose();
      onAfterClose();
    };
  }, [onAfterClose, onClose]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="large"
      placement="right"
      title={<BaseMinionDrawerTitle name={id} />}
      extra={!!innerId && !!slug && <BaseMinionDrawerLink slug={slug} innerId={innerId} />}
      afterOpenChange={handleAfterOpenChange}
    >
      {isLoading && <BaseMinionDrawerLoader />}

      {hasData && !error && !isLoading
        ? children
        : error && <BaseMinionDrawerError message={error} />}
    </Drawer>
  );
}
