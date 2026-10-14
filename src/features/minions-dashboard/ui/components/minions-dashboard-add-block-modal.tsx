import { Button, Cascader, ConfigProvider, Empty, Flex, Modal, Spin, Typography } from "antd";
import type { DefaultOptionType } from "antd/es/cascader";
import type { TFunction } from "i18next";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  DEFAULT_PREVIEW_SWATCH_COUNT,
  PRESET_PREVIEW_SWATCH_COUNT,
} from "../../constants/dashboard-preview";
import {
  getPresetOptionsForFieldType,
  type DashboardCardConfig,
  type DashboardFieldOption,
  type DashboardPreset,
} from "../../model/dashboard-model";

import styles from "./minions-dashboard-add-block-modal.module.css";

const GRAINS_GROUP_KEY = "grains";

const FIELD_CASCADER_THEME = {
  components: {
    Cascader: {
      optionSelectedFontWeight: 400,
    },
  },
};

type FieldCascaderOption = {
  value: string;
  label: string;
  children?: FieldCascaderOption[];
};

const getFieldCascaderOptions = (
  fieldOptions: DashboardFieldOption[],
  t: TFunction
): FieldCascaderOption[] => {
  const groups = new Map<string, FieldCascaderOption>();

  fieldOptions.forEach((option) => {
    const { extraCategory } = option;
    const groupKey = extraCategory
      ? `${extraCategory.source}.${extraCategory.name}`
      : GRAINS_GROUP_KEY;
    const groupLabel = extraCategory
      ? (option.categoryLabel ?? t("dashboard.field-group-extra"))
      : t("dashboard.field-group-grains");
    const label = extraCategory
      ? option.value
      : `${t(`dashboard.field-${option.value}`, { defaultValue: option.label })} (${option.source})`;

    const group = groups.get(groupKey) ?? { value: groupKey, label: groupLabel, children: [] };
    group.children?.push({ value: option.source, label });
    groups.set(groupKey, group);
  });

  return Array.from(groups.values());
};

const getFieldCascaderValue = (
  fieldSource: string | undefined,
  options: FieldCascaderOption[]
): string[] | undefined => {
  if (!fieldSource) {
    return undefined;
  }

  const group = options.find((option) =>
    option.children?.some((child) => child.value === fieldSource)
  );
  if (!group) {
    return undefined;
  }

  return [group.value, fieldSource];
};

const filterFieldCascader = (inputValue: string, path: DefaultOptionType[]) => {
  const query = inputValue.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return path.some((item) =>
    String(item.label ?? "")
      .toLowerCase()
      .includes(query)
  );
};

type MinionsDashboardAddBlockModalProps = {
  open: boolean;
  initialCard?: DashboardCardConfig | null;
  fieldOptions: DashboardFieldOption[];
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (fieldOption: DashboardFieldOption, preset: DashboardPreset) => void;
};

export const MinionsDashboardAddBlockModal = ({
  open,
  initialCard,
  fieldOptions,
  isLoading = false,
  onClose,
  onSubmit,
}: MinionsDashboardAddBlockModalProps) => {
  const { t } = useTranslation();
  const [selectedField, setSelectedField] = useState<string>();
  const [selectedPreset, setSelectedPreset] = useState<DashboardPreset>();

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedField(initialCard?.fieldSource);
    setSelectedPreset(initialCard?.preset);
  }, [initialCard, open]);

  const fieldOption = useMemo(
    () => fieldOptions.find((option) => option.source === selectedField),
    [fieldOptions, selectedField]
  );

  const presetOptions = useMemo(
    () => (fieldOption ? getPresetOptionsForFieldType(fieldOption.type) : []),
    [fieldOption]
  );

  const fieldCascaderOptions = useMemo(
    () => getFieldCascaderOptions(fieldOptions, t),
    [fieldOptions, t]
  );
  const fieldCascaderValue = useMemo(
    () => getFieldCascaderValue(selectedField, fieldCascaderOptions),
    [fieldCascaderOptions, selectedField]
  );

  const handleFieldChange = (path?: (string | number)[]) => {
    const fieldSource = path?.at(-1);
    const nextField =
      typeof fieldSource === "string"
        ? fieldOptions.find((option) => option.source === fieldSource)
        : undefined;
    setSelectedField(nextField?.source);
    setSelectedPreset(
      nextField ? getPresetOptionsForFieldType(nextField.type)[0].value : undefined
    );
  };

  const handleSubmit = () => {
    if (!fieldOption || !selectedPreset) {
      return;
    }
    onSubmit(fieldOption, selectedPreset);
  };

  const isEditMode = Boolean(initialCard);

  return (
    <Modal
      title={t(isEditMode ? "dashboard.edit-block-modal-title" : "dashboard.add-block-modal-title")}
      open={open}
      onCancel={onClose}
      footer={
        <Flex justify="end" gap={8}>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="primary" disabled={!fieldOption || !selectedPreset} onClick={handleSubmit}>
            {t(isEditMode ? "dashboard.save-block" : "dashboard.create-block")}
          </Button>
        </Flex>
      }
      width={840}
    >
      <Flex vertical gap={20}>
        <Flex vertical gap={8}>
          <Typography.Text strong>{t("dashboard.field-label")}</Typography.Text>
          <Spin spinning={isLoading} className={styles.fieldCascader}>
            <ConfigProvider theme={FIELD_CASCADER_THEME}>
              <Cascader
                allowClear
                showSearch={{ filter: filterFieldCascader }}
                value={fieldCascaderValue}
                options={fieldCascaderOptions}
                placeholder={t("dashboard.field-placeholder")}
                displayRender={(labels) => labels.join(" / ")}
                className={styles.fieldCascader}
                onChange={handleFieldChange}
              />
            </ConfigProvider>
          </Spin>
        </Flex>

        <Flex vertical gap={8}>
          <Typography.Text strong>{t("dashboard.preset-label")}</Typography.Text>
          {fieldOption ? (
            <div className={styles.presetsGrid}>
              {presetOptions.map((preset) => (
                <Button
                  key={preset.value}
                  type="text"
                  className={`${styles.presetCard} ${selectedPreset === preset.value ? styles.selected : ""}`}
                  onClick={() => setSelectedPreset(preset.value)}
                >
                  <span
                    className={`${styles.presetPreview} ${styles[`preview-${preset.value}`]}`}
                    aria-hidden
                  >
                    {Array.from({
                      length:
                        PRESET_PREVIEW_SWATCH_COUNT[preset.value] ?? DEFAULT_PREVIEW_SWATCH_COUNT,
                    }).map((_, index) => (
                      <span key={index} />
                    ))}
                  </span>
                  <span className={styles.presetContent}>
                    <span className={styles.presetName}>{t(preset.labelKey)}</span>
                    <span className={styles.presetDescription}>{t(preset.descriptionKey)}</span>
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("dashboard.select-field-first")}
            />
          )}
        </Flex>
      </Flex>
    </Modal>
  );
};
