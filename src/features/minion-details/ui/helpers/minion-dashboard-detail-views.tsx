import { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import {
  BooleanDisplay,
  FilterActionButton,
  InfoDescriptions,
  type InfoDescriptionsItem,
  isEmptyDisplayValue,
} from "@saltbox/saltbox-frontend-common";
import { Flex, type CollapseProps } from "antd";
import type { ReactNode } from "react";

import { transformGrainValueToString } from "saltbox-core/shared/utils/transform-grain-value-to-string";

import type { OnFilterButtonHandler } from "../../types/minion-details-props";

type SimpleGrainKeys = {
  [K in keyof MinionDetailSchema["grains"] as MinionDetailSchema["grains"][K] extends ReactNode
    ? K
    : never]: MinionDetailSchema["grains"][K];
};

type MinionDetailItemProps = Partial<
  Omit<InfoDescriptionsItem, "children" | "copyText" | "actions">
>;

interface MinionSimpleDetailView {
  key: keyof SimpleGrainKeys;
  name: string;
  itemProps?: MinionDetailItemProps;
}

interface MinionExtendDetailView {
  key: string;
  value: (minionDetailSchema: MinionDetailSchema) => ReactNode;
  render?: (minionDetailSchema: MinionDetailSchema) => ReactNode;
  name: string;
  filterField?: string;
  itemProps?: MinionDetailItemProps;
}

export type MinionDetailView = MinionSimpleDetailView | MinionExtendDetailView;

export interface MinionDetailViewGroup {
  name: string;
  details: MinionDetailView[];
}

interface MinionDetailViewsRenderOptions {
  schema: MinionDetailSchema;
  onFilterButton?: OnFilterButtonHandler;
}

function transformValueToString(value: unknown): string {
  return transformGrainValueToString(value as ReactNode);
}

export function renderArrayValue(value: unknown[], keyPrefix: string): ReactNode {
  if (value.length === 0) {
    return null;
  }

  return (
    <Flex vertical>
      {value.map((item, index) => (
        <div key={`${keyPrefix}-${index}`}>{transformValueToString(item)}</div>
      ))}
    </Flex>
  );
}

function renderGrainValue(value: ReactNode, keyPrefix: string): ReactNode {
  if (typeof value === "boolean") {
    return <BooleanDisplay value={value} />;
  }

  if (Array.isArray(value)) {
    return renderArrayValue(value, keyPrefix);
  }

  return value;
}

function renderFilterButton(
  onFilterButton: OnFilterButtonHandler | undefined,
  name: string,
  value: unknown
): ReactNode {
  if (!onFilterButton?.canApply(name, value)) {
    return null;
  }

  return (
    <FilterActionButton
      active={onFilterButton.isActive(name, value)}
      onClick={() => onFilterButton({ name, value })}
    />
  );
}

export function minionDetailsViewsToDescriptionItems(
  minionDetailViews: MinionDetailView[],
  { schema, onFilterButton }: MinionDetailViewsRenderOptions
): InfoDescriptionsItem[] {
  return minionDetailViews.map((minionDetailView) => {
    const baseItem = {
      key: minionDetailView.key,
      label: minionDetailView.name,
      ...minionDetailView.itemProps,
    };

    if ("value" in minionDetailView) {
      const grainValue = minionDetailView.value(schema);
      if (isEmptyDisplayValue(grainValue)) {
        return { ...baseItem, children: null };
      }

      return {
        ...baseItem,
        children: minionDetailView.render ? minionDetailView.render(schema) : grainValue,
        copyText: transformGrainValueToString(grainValue),
        actions:
          minionDetailView.filterField &&
          renderFilterButton(onFilterButton, minionDetailView.filterField, grainValue),
      };
    }

    const grainValue = schema.grains[minionDetailView.key];

    return {
      ...baseItem,
      children: renderGrainValue(grainValue, String(minionDetailView.key)),
      copyText: Array.isArray(grainValue)
        ? grainValue.map((item) => transformValueToString(item)).join("\n")
        : transformValueToString(grainValue),
      actions: renderFilterButton(
        onFilterButton,
        `grains.${String(minionDetailView.key)}`,
        grainValue
      ),
    };
  });
}

export function minionDetailViewGroupsToCollapseItems(
  minionDetailViewGroups: MinionDetailViewGroup[],
  options: MinionDetailViewsRenderOptions
): CollapseProps["items"] {
  return minionDetailViewGroups.map((minionDetailViewGroup) => {
    return {
      key: minionDetailViewGroup.name,
      label: minionDetailViewGroup.name,
      children: (
        <InfoDescriptions
          items={minionDetailsViewsToDescriptionItems(minionDetailViewGroup.details, options)}
        />
      ),
    };
  });
}
