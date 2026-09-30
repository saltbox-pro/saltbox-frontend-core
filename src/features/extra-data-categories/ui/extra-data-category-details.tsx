import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  BooleanDisplay,
  InfoDescriptions,
  type InfoDescriptionsProps,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_EXTRA_FIELDS_POLICY } from "../constants/extra-fields-policies";

import { ExtraDataCategoryOriginTag } from "./extra-data-category-origin-tag";
import { ExtraDataCategoryTypeTag } from "./extra-data-category-type-tag";

type ExtraDataCategoryDetailsProps = {
  category: ExtraDataCategoryModel;
};

export function ExtraDataCategoryDetails({ category }: ExtraDataCategoryDetailsProps) {
  const { t } = useTranslation();

  const {
    is_system: isSystem,
    type,
    is_manual_data_allowed: isManualDataAllowed,
    extra_fields_policy: extraFieldsPolicy,
    created,
    modified,
  } = category;

  const items = useMemo<InfoDescriptionsProps["items"]>(() => {
    const policy = extraFieldsPolicy ?? DEFAULT_EXTRA_FIELDS_POLICY;

    return [
      {
        key: "type",
        label: t("extra-data-categories.attributes.type"),
        children: <ExtraDataCategoryTypeTag type={type} />,
      },
      {
        key: "origin",
        label: t("extra-data-categories.attributes.origin"),
        children: <ExtraDataCategoryOriginTag isSystem={isSystem} />,
      },
      {
        key: "manual-data-allowed",
        label: t("extra-data-categories.attributes.manual-data-allowed"),
        children: <BooleanDisplay value={isManualDataAllowed} />,
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
        children: created ? formatTimeByUserTZ(created) : null,
      },
      {
        key: "modified",
        label: t("extra-data-categories.attributes.modified"),
        children: modified ? formatTimeByUserTZ(modified) : null,
      },
    ];
  }, [created, extraFieldsPolicy, isManualDataAllowed, isSystem, modified, t, type]);

  return <InfoDescriptions items={items} />;
}
