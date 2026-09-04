import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { Space } from "antd";

import {
  getSourceBranch,
  getSourceMountedPath,
  getSourceNamespaceLabel,
  getSourceWebUrl,
} from "../helpers/source-presentation";

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
    <Space direction="vertical" size="small">
      <TemplateSourceInfo
        description={source.description}
        webUrl={getSourceWebUrl(source)}
        branch={getSourceBranch(source)}
        mountedPath={getSourceMountedPath(source)}
        namespace={getSourceNamespaceLabel(source)}
        createdAt={source.created}
        syncedAt={source.synced_at}
        showNotSynced={showNotSynced}
        dimmed={dimmed}
      />

      <TemplateSourceLastErrorAlert source={source} />
    </Space>
  );
}
