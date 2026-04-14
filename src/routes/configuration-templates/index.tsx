import { SettingOutlined } from "@ant-design/icons";
import { PageLayout } from "@saltbox/saltbox-frontend-common";
import { Button, Dropdown, Tabs } from "antd";
import { useTranslation } from "react-i18next";

import { AvailableForDownloadTab } from "saltbox-core/features/configuration-templates/available-for-download";

export default function ConfigurationTemplatesPage() {
  const { t } = useTranslation();

  return (
    <PageLayout title={t("configuration-templates.page-title")}>
      <Tabs
        items={[
          {
            key: "available",
            label: t("configuration-templates.tabs.available-for-download.title"),
            children: <AvailableForDownloadTab />,
          },
        ]}
        tabBarExtraContent={{
          right: (
            <Dropdown trigger={["click"]} disabled>
              <Button icon={<SettingOutlined />} />
            </Dropdown>
          ),
        }}
      />
    </PageLayout>
  );
}
