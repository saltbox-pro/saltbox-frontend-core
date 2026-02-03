import { CopyToClipboardButton } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

interface MinionDetailsDrawerTitleProps {
  id: string | undefined;
}

export function MinionDetailsDrawerTitle({ id = "" }: MinionDetailsDrawerTitleProps) {
  const { t } = useTranslation();

  return (
    <>
      {`${t("minions.minion")} ${id ? `"${id}"` : ""}`}
      {!!id && <CopyToClipboardButton text={id} />}
    </>
  );
}
