import { Flex } from "antd";

import {
  TemplateSourceDescription,
  TemplateSourceDimmed,
} from "saltbox-core/features/template-source-ui";

import { TemplateSourceDates } from "./template-source-dates";
import { TemplateSourceLink } from "./template-source-link";

export type TemplateSourceInfoProps = {
  description?: string | null;
  webUrl?: string;
  createdAt?: string;
  syncedAt?: string | null;
  showNotSynced?: boolean;
  dimmed?: boolean;
  searchQuery?: string;
};

export function TemplateSourceInfo({
  description,
  webUrl,
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
        {!!webUrl && (
          <TemplateSourceDimmed dimmed={dimmed}>
            <TemplateSourceLink href={webUrl} />
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
