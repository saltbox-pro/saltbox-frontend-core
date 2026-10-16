import {
  type AntDValueSelectorProps,
  MatIcon,
  normalizeMaterialIconValue,
  SaltBoxMinionValueSelector,
} from "@saltbox/saltbox-frontend-common";
import { Cascader, ConfigProvider, Flex, Input } from "antd";
import type { DefaultOptionType } from "antd/es/cascader";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState, type FC, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useValueSelector, type ValueSelectorProps } from "react-querybuilder";

import { useExtraDataCategoriesStore } from "saltbox-core/shared/contexts/extra-data-categories-context";
import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";
import {
  buildMinionFilterFieldCascaderOptions,
  flattenMinionFilterSchemaFields,
  getMinionFilterFieldCascaderValue,
  MINION_FILTER_CUSTOM_GRAIN_VALUE,
  type MinionFilterFieldCascaderOption,
} from "saltbox-core/shared/helpers/minion-filter-field-cascader";

import styles from "./core-minion-value-selector.module.css";

const RULE_FIELDS_CLASS = "rule-fields";

const FIELD_CASCADER_THEME = {
  components: {
    Cascader: {
      optionSelectedFontWeight: 400,
    },
  },
};

type CascaderOptionWithSearch = DefaultOptionType & {
  label: string;
  searchLabel: string;
  icon?: string | null;
  children?: CascaderOptionWithSearch[];
};

const toCascaderOptions = (
  options: MinionFilterFieldCascaderOption[]
): CascaderOptionWithSearch[] =>
  options.map((option) => ({
    value: option.value,
    label: option.label,
    searchLabel: option.searchText ?? option.label,
    icon: option.icon,
    children: option.children?.map((child) => ({
      value: child.value,
      label: child.label,
      searchLabel: child.searchText ?? child.label,
    })),
  }));

const withOptionIcon = (icon: string | null | undefined, content: ReactNode): ReactNode => {
  const iconName = normalizeMaterialIconValue(icon);
  if (!iconName) {
    return content;
  }

  return (
    <span className={styles.optionLabel}>
      <MatIcon icon={iconName} size="small" />
      <span>{content}</span>
    </span>
  );
};

const filterFieldCascader = (inputValue: string, path: DefaultOptionType[]) => {
  const query = inputValue.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return path.some((item) => {
    const typed = item as CascaderOptionWithSearch;
    const searchLabel = typed.searchLabel ?? String(typed.label ?? typed.value ?? "");
    return searchLabel.toLowerCase().includes(query);
  });
};

const renderFieldCascaderOption = (option: DefaultOptionType): ReactNode => {
  const typed = option as CascaderOptionWithSearch;
  if (typeof typed.label !== "string") {
    return typed.label;
  }

  return withOptionIcon(typed.icon, typed.label);
};

type CoreMinionFieldCascaderProps = Pick<
  ValueSelectorProps,
  "className" | "handleOnChange" | "options" | "value" | "title" | "disabled"
>;

const CoreMinionFieldCascader = observer(
  ({
    className,
    handleOnChange,
    options,
    value,
    title,
    disabled,
  }: CoreMinionFieldCascaderProps) => {
    const { t, i18n } = useTranslation();
    const { t: tCommon } = useTranslation("common");
    const categoriesStore = useExtraDataCategoriesStore();
    const [isCustomValue, setIsCustomValue] = useState(false);
    const [customValue, setCustomValue] = useState("");

    const { onChange, val } = useValueSelector({
      handleOnChange,
      listsAsArrays: false,
      multiple: false,
      value,
    });

    const schemaFields = useMemo(() => flattenMinionFilterSchemaFields(options), [options]);
    const knownFieldValues = useMemo(
      () => new Set(schemaFields.map((field) => field.name)),
      [schemaFields]
    );

    useEffect(() => {
      const selectedField = typeof val === "string" ? val : "";
      if (!selectedField) {
        setIsCustomValue(false);
        setCustomValue("");
        return;
      }

      if (schemaFields.length === 0) {
        setIsCustomValue(false);
        setCustomValue("");
        return;
      }

      const isKnownField = knownFieldValues.has(selectedField);
      const isCustomField = selectedField.startsWith("grains.") && !isKnownField;
      if (!isCustomField) {
        setIsCustomValue(false);
        setCustomValue("");
        return;
      }

      setIsCustomValue(true);
      setCustomValue(selectedField.slice("grains.".length));
    }, [knownFieldValues, schemaFields.length, val]);

    const cascaderCategories = useMemo(
      () =>
        categoriesStore.categories.map((category) => ({
          source: category.source,
          name: category.name,
          label: getExtraDataCategoryDisplayName(category, i18n.language),
          icon: category.icon,
        })),
      [categoriesStore.categories, i18n.language]
    );

    const cascaderDataOptions = useMemo(
      () =>
        buildMinionFilterFieldCascaderOptions({
          fields: schemaFields,
          categories: cascaderCategories,
          grainsGroupLabel: t("dashboard.field-group-grains"),
          customGrainLabel: tCommon("query-builder.custom-grain"),
        }),
      [cascaderCategories, schemaFields, t, tCommon]
    );

    const cascaderOptions = useMemo(
      () => toCascaderOptions(cascaderDataOptions),
      [cascaderDataOptions]
    );

    const cascaderValue = useMemo(
      () =>
        getMinionFilterFieldCascaderValue(
          typeof val === "string" ? val : undefined,
          cascaderDataOptions,
          isCustomValue
        ),
      [cascaderDataOptions, isCustomValue, val]
    );

    const handleCascaderChange = (path?: (string | number | null)[]) => {
      const leaf = path?.at(-1);
      if (typeof leaf !== "string") {
        setIsCustomValue(false);
        setCustomValue("");
        onChange("");
        return;
      }

      if (leaf === MINION_FILTER_CUSTOM_GRAIN_VALUE) {
        setIsCustomValue(true);
        onChange("grains.");
        return;
      }

      setIsCustomValue(false);
      setCustomValue("");
      onChange(leaf);
    };

    return (
      <Flex gap={8} className={className}>
        <ConfigProvider theme={FIELD_CASCADER_THEME}>
          <Cascader
            allowClear={false}
            showSearch={{ filter: filterFieldCascader }}
            optionRender={renderFieldCascaderOption}
            title={title}
            value={cascaderValue}
            options={cascaderOptions}
            displayRender={(labels) => labels.join(" / ")}
            className={styles.fieldCascader}
            disabled={disabled}
            onChange={handleCascaderChange}
          />
        </ConfigProvider>
        {isCustomValue && (
          <Input
            value={customValue}
            onChange={(event) => {
              const nextValue = event.target.value;
              setCustomValue(nextValue);
              onChange(`grains.${nextValue}`);
            }}
            disabled={disabled}
            title={title}
            aria-label={tCommon("query-builder.grain-name")}
            placeholder={tCommon("query-builder.grain-name")}
          />
        )}
      </Flex>
    );
  }
);

export const CoreMinionValueSelector: FC<ValueSelectorProps> = (props) => {
  if (props.className === RULE_FIELDS_CLASS) {
    return (
      <CoreMinionFieldCascader
        className={props.className}
        handleOnChange={props.handleOnChange}
        options={props.options}
        value={props.value}
        title={props.title}
        disabled={props.disabled}
      />
    );
  }

  return <SaltBoxMinionValueSelector {...(props as AntDValueSelectorProps)} />;
};
