import { Trans } from "react-i18next";

const MASTERS_PAGE_PATH = "/core/masters";

type AcceptedMastersWarningMessageProps = {
  action: string;
  onMastersClick?: () => void;
};

export function AcceptedMastersWarningMessage({
  action,
  onMastersClick,
}: AcceptedMastersWarningMessageProps) {
  return (
    <Trans
      i18nKey="accepted-masters.warning-template"
      values={{ action }}
      components={{
        mastersLink: (
          <a
            href={MASTERS_PAGE_PATH}
            aria-label="Masters"
            onClick={(e) => {
              if (!onMastersClick) return;
              e.preventDefault();
              onMastersClick();
            }}
          />
        ),
      }}
    />
  );
}
