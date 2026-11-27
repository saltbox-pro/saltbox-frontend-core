import {
  Button,
  Cascader,
  ConfigProvider,
  Empty,
  Flex,
  Modal,
  Segmented,
  Spin,
  Typography,
} from "antd";
import type { DefaultOptionType } from "antd/es/cascader";
import type { TFunction } from "i18next";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  buildMinionFieldCascaderOptions,
  getMinionFieldCascaderValue,
  type LabelComparator,
  type MinionFieldCascaderOption,
} from "saltbox-core/shared/helpers/minion-field-cascader";
import { useFilterLabelComparator } from "saltbox-core/shared/hooks/useFilterLabelComparator";

import {
  DEFAULT_PREVIEW_SWATCH_COUNT,
  PRESET_PREVIEW_SWATCH_COUNT,
} from "../../constants/dashboard-preview";
import {
  createDefaultHistorySettings,
  getHistorySettingsError,
  type CollectionHistorySettings,
} from "../../model/collection-history";
import {
  getPresetOptionsForFieldType,
  type DashboardCardConfig,
  type DashboardCardInput,
  type DashboardFieldOption,
  type DashboardFieldPreset,
} from "../../model/dashboard-model";

import { CollectionHistorySettingsEditor } from "./collection-history-settings";
import styles from "./minions-dashboard-add-block-modal.module.css";

const FIELD_CASCADER_THEME = {
  components: {
    Cascader: {
      optionSelectedFontWeight: 400,
    },
  },
};

const getFieldCascaderOptions = (
  fieldOptions: DashboardFieldOption[],
  t: TFunction,
  compareLabels: LabelComparator
): MinionFieldCascaderOption[] =>
  buildMinionFieldCascaderOptions({
    fields: fieldOptions.map((option) => ({
      name: option.source,
      label: option.extraCategory
        ? option.label
        : t(`dashboard.field-${option.value}`, { defaultValue: option.label }),
      group: option.group,
      extraCategory: option.extraCategory,
    })),
    categories: fieldOptions.flatMap(({ extraCategory, categoryLabel }) =>
      extraCategory ? [{ ...extraCategory, label: categoryLabel ?? extraCategory.name }] : []
    ),
    generalGroupLabel: t("dashboard.field-group-general"),
    grainsGroupLabel: t("dashboard.field-group-grains"),
    extraDataGroupLabel: t("dashboard.field-group-extra"),
    compareLabels,
  });

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
  onSubmit: (input: DashboardCardInput) => void;
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
  const compareLabels = useFilterLabelComparator();
  const [selectedField, setSelectedField] = useState<string>();
  const [selectedPreset, setSelectedPreset] = useState<DashboardFieldPreset>();
  const [kind, setKind] = useState<"field" | "collection-history">("field");
  const [historySettings, setHistorySettings] = useState<CollectionHistorySettings>(
    createDefaultHistorySettings
  );
  const historyTimezone =
    open && kind === "collection-history"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined;
  const historyError = useMemo(
    () => (historyTimezone ? getHistorySettingsError(historySettings, historyTimezone) : null),
    [historySettings, historyTimezone]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const historyCard = initialCard?.kind === "collection-history" ? initialCard : null;
    const fieldCard = initialCard?.kind !== "collection-history" ? initialCard : null;
    setKind(historyCard ? "collection-history" : "field");
    setHistorySettings(historyCard?.settings ?? createDefaultHistorySettings());
    setSelectedField(fieldCard?.fieldSource);
    setSelectedPreset(fieldCard?.preset);
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
    () => getFieldCascaderOptions(fieldOptions, t, compareLabels),
    [fieldOptions, t, compareLabels]
  );
  const fieldCascaderValue = useMemo(
    () => getMinionFieldCascaderValue(selectedField, fieldCascaderOptions),
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
    if (kind === "collection-history") {
      if (!historyError) {
        onSubmit({ kind, settings: historySettings });
      }
      return;
    }
    if (!fieldOption || !selectedPreset) {
      return;
    }
    onSubmit({ kind: "field", fieldOption, preset: selectedPreset });
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
          <Button
            type="primary"
            disabled={
              kind === "collection-history" ? !!historyError : !fieldOption || !selectedPreset
            }
            onClick={handleSubmit}
          >
            {t(isEditMode ? "dashboard.save-block" : "dashboard.create-block")}
          </Button>
        </Flex>
      }
      width={840}
    >
      <Flex vertical gap={20}>
        {!isEditMode && (
          <Segmented<"field" | "collection-history">
            block
            value={kind}
            options={[
              { value: "field", label: t("dashboard.block-kind-field") },
              { value: "collection-history", label: t("dashboard.history-title") },
            ]}
            onChange={setKind}
          />
        )}
        {kind === "collection-history" ? (
          <Flex vertical gap={20}>
            <div className={styles.historyPreview}>
              <svg viewBox="0 0 600 80" preserveAspectRatio="none" aria-hidden="true">
                <path
                  d="M0 65L65 48L145 55L230 30L310 38L390 20L470 25L540 8L600 12V80H0Z"
                  fill="currentColor"
                  opacity="0.1"
                />
                <path
                  d="M0 65L65 48L145 55L230 30L310 38L390 20L470 25L540 8L600 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <Typography.Text strong>{t("dashboard.history-title")}</Typography.Text>
              <Typography.Text type="secondary">
                {t("dashboard.history-description")}
              </Typography.Text>
            </div>
            <CollectionHistorySettingsEditor
              error={historyError}
              timezone={historyTimezone}
              value={historySettings}
              onChange={setHistorySettings}
            />
          </Flex>
        ) : (
          <>
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
                            PRESET_PREVIEW_SWATCH_COUNT[preset.value] ??
                            DEFAULT_PREVIEW_SWATCH_COUNT,
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
          </>
        )}
      </Flex>
    </Modal>
  );
};
