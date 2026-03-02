import { CopyToClipboardButton } from "@saltbox/saltbox-frontend-common";

interface InfoDrawerTitleProps {
  name?: string;
  label?: string;
}

export function InfoDrawerTitle({ name, label }: InfoDrawerTitleProps) {
  if (!name) {
    return null;
  }

  return (
    <>
      {label ? `${label} ${name}` : name} <CopyToClipboardButton text={name} />
    </>
  );
}
