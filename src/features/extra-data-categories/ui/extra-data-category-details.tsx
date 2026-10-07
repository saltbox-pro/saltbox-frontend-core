import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  BooleanDisplay,
  InfoDescriptions,
  type InfoDescriptionsProps,
  MatIcon,
  formatTimeByUserTZ,
  getLocalizedText,
  normalizeMaterialIconValue,
} from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";

import { DEFAULT_EXTRA_FIELDS_POLICY } from "../constants/extra-fields-policies";

import { ExtraDataCategoryOriginTag } from "./extra-data-category-origin-tag";
import { ExtraDataCategoryTypeTag } from "./extra-data-category-type-tag";

type ExtraDataCategoryDetailsProps = {
  category: ExtraDataCategoryModel;
  readOnly?: boolean;
  titleField?: ReactNode;
  descriptionField?: ReactNode;
  extra?: ReactNode;
};

function CategoryTitle({
  category,
  language,
}: {
  category: ExtraDataCategoryModel;
  language: string;
}) {
  const iconName = normalizeMaterialIconValue(category.icon);
  const titleText = getExtraDataCategoryDisplayName(category, language);

  return (
    <Flex align="center" gap="small">
      {iconName ? <MatIcon icon={iconName} size="small" /> : null}
      {titleText}
    </Flex>
  );
}

export function ExtraDataCategoryDetails({
  category,
  readOnly = false,
  titleField,
  descriptionField,
  extra,
}: ExtraDataCategoryDetailsProps) {
  const { t, i18n } = useTranslation();

  const items = useMemo<InfoDescriptionsProps["items"]>(() => {
    const policy = category.extra_fields_policy ?? DEFAULT_EXTRA_FIELDS_POLICY;
    const descriptionText = getLocalizedText(category.description, i18n.language);

    return [
      {
        key: "title",
        label: t("extra-data-categories.attributes.name"),
        children: readOnly ? (
          <CategoryTitle category={category} language={i18n.language} />
        ) : (
          titleField
        ),
      },
      {
        key: "description",
        label: t("extra-data-categories.attributes.description"),
        children: readOnly ? descriptionText || null : descriptionField,
      },
      {
        key: "type",
        label: t("extra-data-categories.attributes.type"),
        children: <ExtraDataCategoryTypeTag type={category.type} />,
      },
      {
        key: "origin",
        label: t("extra-data-categories.attributes.origin"),
        children: <ExtraDataCategoryOriginTag isSystem={category.is_system} />,
      },
      {
        key: "manual-data-allowed",
        label: t("extra-data-categories.attributes.manual-data-allowed"),
        children: <BooleanDisplay value={category.is_manual_data_allowed} />,
      },
      {
        key: "single-item",
        label: t("extra-data-categories.attributes.single-item"),
        children: <BooleanDisplay value={category.is_single_item} />,
      },
      {
        key: "extra-fields-policy",
        label: t("extra-data-categories.attributes.extra-fields-policy"),
        children: t(`extra-data-categories.extra-fields-policies.${policy}`, {
          defaultValue: policy,
        }),
      },
      {
        key: "created",
        label: t("extra-data-categories.attributes.created"),
        children: category.created ? formatTimeByUserTZ(category.created) : null,
      },
      {
        key: "modified",
        label: t("extra-data-categories.attributes.modified"),
        children: category.modified ? formatTimeByUserTZ(category.modified) : null,
      },
    ];
  }, [category, descriptionField, i18n.language, readOnly, t, titleField]);

  return <InfoDescriptions items={items} extra={extra} />;
}
