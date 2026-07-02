import { type CollapseProps, Collapse } from "antd";
import { useMemo } from "react";

import { INSTANT_COLLAPSE_MOTION } from "saltbox-core/shared/constants/collapse-motion";

import type { TemplateSourceRow } from "../../../helpers/template-picker-rows";
import type { SelectedTaskTemplate } from "../../../type/types";

import { SourceCollapseLabel } from "./source-collapse-label";
import { TemplateListCollapseActiveKeysProvider } from "./template-list-collapse-active-keys-context";
import styles from "./template-list-modal.module.css";
import { TemplateListSourcePanel } from "./template-list-source-panel";

export type TemplateListSourcesCollapseProps = {
  filteredRows: TemplateSourceRow[];
  activeKeys: string[];
  searchQuery?: string;
  isSearchReset: boolean;
  getSourceLabel: (sourceName: string) => string;
  onCollapseChange: CollapseProps["onChange"];
  onSelectTemplate: (template: SelectedTaskTemplate) => void;
};

export function TemplateListSourcesCollapse({
  filteredRows,
  activeKeys,
  searchQuery,
  isSearchReset,
  getSourceLabel,
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
            onSelectTemplate={onSelectTemplate}
          />
        ),
      })),
    [filteredRows, getSourceLabel, onSelectTemplate, searchQuery]
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
