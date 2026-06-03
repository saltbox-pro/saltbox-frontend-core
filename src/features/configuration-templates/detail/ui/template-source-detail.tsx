import { Alert, Flex, Skeleton, Space } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { getTemplateSourceViewState } from "../../shared/helpers/get-template-source-view-state";
import { TemplateSourceActionsToolbar } from "../../actions/ui/template-source-actions-toolbar";
import { TemplateSourceContent } from "../../shared/ui/template-source-content";
import { TemplateSourceTags } from "../../shared/ui/template-source-tags";
import { TemplateSourceTemplatesSection } from "../../shared/ui/template-source-templates-section";
import type { TemplateSourceDetailStore } from "../store/template-source-detail-store";

type TemplateSourceDetailProps = {
  store: TemplateSourceDetailStore;
};

export const TemplateSourceDetail = observer(function TemplateSourceDetail({
  store,
}: TemplateSourceDetailProps) {
  const { t } = useTranslation();

  if (store.isLoading) {
    return <Skeleton active />;
  }

  if (store.hasError) {
    return <Alert type="error" showIcon message={t("configuration-templates.detail.load-error")} />;
  }

  if (!store.source) {
    return null;
  }

  const view = getTemplateSourceViewState(store.source, store);
  const templatesState = store.templatesStore.getState(store.source.id);

  return (
    <Space direction="vertical" size="large">
      <Flex vertical gap="middle">
        <Flex align="flex-start" justify="space-between" gap="middle" wrap>
          <TemplateSourceTags
            sourceType={store.source.source_type}
            isConnected={view.isConnected}
            showActiveStatus={view.presentation.showActiveStatus}
          />

          <TemplateSourceActionsToolbar
            source={store.source}
            actions={store}
            canConnect={view.canConnect}
            canSync={view.canSync}
            showDelete={view.showDelete}
          />
        </Flex>

        <TemplateSourceContent
          source={store.source}
          showNotSynced={view.showNotSynced}
          dimmed={view.forceDimmed}
        />
      </Flex>

      <TemplateSourceTemplatesSection
        defaultExpanded
        items={templatesState.items}
        isLoading={templatesState.isLoading}
        hasError={templatesState.hasError}
        onOpen={() => store.templatesStore.loadAll(store.source.id)}
      />
    </Space>
  );
});
