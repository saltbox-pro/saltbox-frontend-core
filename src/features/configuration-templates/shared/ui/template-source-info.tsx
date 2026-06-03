import { Flex, Typography } from "antd";

import { TemplateSourceDates } from "./template-source-dates";
import styles from "./template-source-info.module.css";
import { TemplateSourceLink } from "./template-source-link";

const { Paragraph } = Typography;

export type TemplateSourceInfoProps = {
  description?: string | null;
  webUrl?: string;
  createdAt?: string;
  syncedAt?: string | null;
  showNotSynced?: boolean;
  dimmed?: boolean;
};

export function TemplateSourceInfo({
  description,
  webUrl,
  createdAt,
  syncedAt,
  showNotSynced,
  dimmed = false,
}: TemplateSourceInfoProps) {
  return (
    <>
      {!!description && (
        <Paragraph
          type="secondary"
          className={dimmed ? styles.dimmed : undefined}
          style={{ margin: 0 }}
        >
          {description}
        </Paragraph>
      )}

      <Flex vertical gap="small">
        {!!webUrl && (
          <div className={dimmed ? styles.dimmed : undefined}>
            <TemplateSourceLink href={webUrl} />
          </div>
        )}

        <Flex vertical gap="middle" className={dimmed ? styles.dimmed : undefined}>
          <TemplateSourceDates
            createdAt={createdAt}
            syncedAt={syncedAt}
            showNotSynced={showNotSynced}
          />
        </Flex>
      </Flex>
    </>
  );
}
