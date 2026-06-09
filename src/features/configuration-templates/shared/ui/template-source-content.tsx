import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { Space } from "antd";

import { getSourceWebUrl } from "../helpers/source-presentation";

import { TemplateSourceInfo } from "./template-source-info";
import { TemplateSourceLastErrorAlert } from "./template-source-last-error-alert";

export type TemplateSourceContentProps = {
  source: TemplateSourcePublicSchema;
  showNotSynced?: boolean;
  dimmed?: boolean;
};

export function TemplateSourceContent({
  source,
  showNotSynced,
  dimmed = false,
}: TemplateSourceContentProps) {
  return (
    <Space direction="vertical" size="middle">
      <TemplateSourceLastErrorAlert source={source} />

      <TemplateSourceInfo
        description={source.description}
        webUrl={getSourceWebUrl(source)}
        createdAt={source.created}
        syncedAt={source.synced_at}
        showNotSynced={showNotSynced}
        dimmed={dimmed}
      />
    </Space>
  );
}
