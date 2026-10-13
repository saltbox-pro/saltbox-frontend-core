import { Button, Empty, Flex, Modal, Select, Typography } from "antd";
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

type FieldSelectOption = {
  value: string;
  label: string;
  searchLabel: string;
};

type FieldSelectGroup = {
  label: string;
  options: FieldSelectOption[];
};

const getFieldSelectGroups = (
  fieldOptions: DashboardFieldOption[],
  t: TFunction
): FieldSelectGroup[] => {
  const groups = new Map<string, FieldSelectGroup>();

  fieldOptions.forEach((option) => {
    const { extraCategory } = option;
    const groupKey = extraCategory ? `${extraCategory.source}.${extraCategory.name}` : "grains";
    const groupLabel = extraCategory
      ? (option.categoryLabel ?? t("dashboard.field-group-extra"))
      : t("dashboard.field-group-grains");
    const label = extraCategory
      ? option.value
      : `${t(`dashboard.field-${option.value}`, { defaultValue: option.label })} (${option.source})`;

    const group = groups.get(groupKey) ?? { label: groupLabel, options: [] };
    group.options.push({ value: option.source, label, searchLabel: `${groupLabel} ${label}` });
    groups.set(groupKey, group);
  });

  return Array.from(groups.values());
};

type MinionsDashboardAddBlockModalProps = {
  open: boolean;
  initialCard?: DashboardCardConfig | null;
  fieldOptions: DashboardFieldOption[];
  onClose: () => void;
  onSubmit: (fieldOption: DashboardFieldOption, preset: DashboardPreset) => void;
};

export const MinionsDashboardAddBlockModal = ({
  open,
  initialCard,
  fieldOptions,
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

  const fieldSelectGroups = useMemo(() => getFieldSelectGroups(fieldOptions, t), [fieldOptions, t]);

  const handleFieldChange = (value: string) => {
    const nextField = fieldOptions.find((option) => option.source === value);
    setSelectedField(value);
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
          <Select
            showSearch
            value={selectedField}
            options={fieldSelectGroups}
            placeholder={t("dashboard.field-placeholder")}
            optionFilterProp="searchLabel"
            popupClassName={styles.fieldSelectDropdown}
            onChange={handleFieldChange}
          />
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
