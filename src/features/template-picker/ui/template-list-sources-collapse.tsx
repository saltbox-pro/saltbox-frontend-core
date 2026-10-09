import type { LoadSource } from "@saltbox/saltbox-frontend-common";
import { type CollapseProps, Collapse } from "antd";
import { useMemo } from "react";

import { INSTANT_COLLAPSE_MOTION } from "saltbox-core/shared/constants/collapse-motion";

import type { TemplateSourceRow } from "../helpers/template-picker-rows";
import type { PickedTemplate } from "../type/types";

import { SourceCollapseLabel } from "./source-collapse-label";
import { TemplateListCollapseActiveKeysProvider } from "./template-list-collapse-active-keys-context";
import { TemplateListSourcePanel } from "./template-list-source-panel";
import styles from "./template-picker-modal.module.css";

export type TemplateListSourcesCollapseProps = {
  filteredRows: TemplateSourceRow[];
  activeKeys: string[];
  searchQuery?: string;
  isSearchReset: boolean;
  getSourceLabel: (sourceName: string) => string;
  getAccessibilityLoad: (sourceId: string) => LoadSource;
  onCollapseChange: CollapseProps["onChange"];
  onSelectTemplate: (template: PickedTemplate) => void;
};

export function TemplateListSourcesCollapse({
  filteredRows,
  activeKeys,
  searchQuery,
  isSearchReset,
  getSourceLabel,
  getAccessibilityLoad,
  onCollapseChange,
  onSelectTemplate,
}: TemplateListSourcesCollapseProps) {
  const collapseItems = useMemo<CollapseProps["items"]>(
    () =>
      filteredRows.map((sourceRow) => ({
        key: sourceRow.key,
        label: (
          <SourceCollapseLabel
            sourceRow={sourceRow}
            searchQuery={searchQuery}
            getSourceLabel={getSourceLabel}
          />
        ),
        children: (
          <TemplateListSourcePanel
            sourceRow={sourceRow}
            searchQuery={searchQuery}
            getAccessibilityLoad={getAccessibilityLoad}
            onSelectTemplate={onSelectTemplate}
          />
        ),
      })),
    [filteredRows, getAccessibilityLoad, getSourceLabel, onSelectTemplate, searchQuery]
  );

  return (
    <TemplateListCollapseActiveKeysProvider activeKeys={activeKeys}>
      <Collapse
        className={styles.sourcesCollapse}
        size="small"
        destroyOnHidden
        activeKey={activeKeys}
        onChange={onCollapseChange}
        items={collapseItems}
        {...(isSearchReset ? { openMotion: INSTANT_COLLAPSE_MOTION } : {})}
      />
    </TemplateListCollapseActiveKeysProvider>
  );
}
