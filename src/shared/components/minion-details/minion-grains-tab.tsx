import { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton } from "@saltbox/saltbox-frontend-common";
import { Flex, Spin } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

interface MinionGrainsTabProps {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
}

export function MinionGrainsTab({ minion, isMinionLoading }: MinionGrainsTabProps) {
  const { t } = useTranslation();

  const combinedGrains = minion
    ? {
        ...minion.grains,
        ...minion.additional_grains,
      }
    : {};

  if (isMinionLoading) {
    return (
      <Flex justify="center" align="center" style={{ height: "100%" }}>
        <Spin />
      </Flex>
    );
  }

  if (!minion) {
    return (
      <Flex justify="center" align="center" style={{ height: "100%" }}>
        {t("minions.no-minion-data-available")}
      </Flex>
    );
  }

  return (
    <div>
      <Flex justify="flex-end" style={{ marginBottom: 8 }}>
        <CopyToClipboardButton text={JSON.stringify(combinedGrains, null, 2)} />
      </Flex>
      <ReactJson
        displayDataTypes={false}
        enableClipboard={false}
        name={false}
        displayObjectSize={false}
        src={combinedGrains}
        collapsed={1}
      />
    </div>
  );
}
