import { PageLayout } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

import { ConfigurationTemplates } from "saltbox-core/features/configuration-templates";

export default function ConfigurationTemplatesPage() {
  const { t } = useTranslation();

  return (
    <PageLayout title={t("configuration-templates.page-title")}>
      <ConfigurationTemplates />
    </PageLayout>
  );
}
