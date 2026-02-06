import { CopyToClipboardButton } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

interface BaseMinionDrawerTitleProps {
  name: string | undefined;
}

export function BaseMinionDrawerTitle({ name = "" }: BaseMinionDrawerTitleProps) {
  const { t } = useTranslation();

  return (
    <>
      {`${t("minions.minion")} ${name ? name : ""}`}
      {!!name && (
        <>
          {" "}
          <CopyToClipboardButton text={null} />
        </>
      )}
    </>
  );
}
