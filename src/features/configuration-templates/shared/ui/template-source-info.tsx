import { Flex } from "antd";

import {
  TemplateSourceDescription,
  TemplateSourceDimmed,
} from "saltbox-core/features/template-source-ui";

import { TemplateSourceDates } from "./template-source-dates";
import { TemplateSourceLink } from "./template-source-link";
import { TemplateSourceMountedPath, TemplateSourceNamespace } from "./template-source-meta";

export type TemplateSourceInfoProps = {
  description?: string | null;
  webUrl?: string;
  branch?: string;
  mountedPath?: string;
  namespace?: string;
  createdAt?: string;
  syncedAt?: string | null;
  showNotSynced?: boolean;
  dimmed?: boolean;
  searchQuery?: string;
};

export function TemplateSourceInfo({
  description,
  webUrl,
  branch,
  mountedPath,
  namespace,
  createdAt,
  syncedAt,
  showNotSynced,
  dimmed = false,
  searchQuery,
}: TemplateSourceInfoProps) {
  return (
    <>
      {!!description && (
        <TemplateSourceDescription
          description={description}
          searchQuery={searchQuery}
          dimmed={dimmed}
        />
      )}

      <Flex vertical gap="small">
        {!!namespace && (
          <TemplateSourceDimmed dimmed={dimmed}>
            <TemplateSourceNamespace namespace={namespace} />
          </TemplateSourceDimmed>
        )}

        {!!mountedPath && (
          <TemplateSourceDimmed dimmed={dimmed}>
            <TemplateSourceMountedPath path={mountedPath} />
          </TemplateSourceDimmed>
        )}

        {!!webUrl && (
          <TemplateSourceDimmed dimmed={dimmed}>
            <TemplateSourceLink href={webUrl} branch={branch} />
          </TemplateSourceDimmed>
        )}

        <TemplateSourceDimmed dimmed={dimmed}>
          <Flex vertical gap="middle">
            <TemplateSourceDates
              createdAt={createdAt}
              syncedAt={syncedAt}
              showNotSynced={showNotSynced}
            />
          </Flex>
        </TemplateSourceDimmed>
      </Flex>
    </>
  );
}
