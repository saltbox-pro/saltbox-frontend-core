import { SourceState, type TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { Alert } from "antd";

type TemplateSourceLastErrorAlertProps = {
  source: Pick<TemplateSourcePublicSchema, "last_error" | "state">;
};

export function TemplateSourceLastErrorAlert({ source }: TemplateSourceLastErrorAlertProps) {
  if (!source.last_error) return null;

  return (
    <Alert
      type={source.state === SourceState.Broken ? "error" : "warning"}
      showIcon
      message={source.last_error}
    />
  );
}
