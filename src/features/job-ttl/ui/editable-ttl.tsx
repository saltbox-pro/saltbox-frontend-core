import { EditOutlined } from "@ant-design/icons";
import { BaseActionButton, formatTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import { Select, Typography } from "antd";
import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import {
  buildTtlOptions,
  formatTtlValue,
  TTL_INHERIT_OPTION_VALUE,
  type TtlOptionValue,
} from "saltbox-core/shared/utils/job-ttl-utils";

import styles from "./editable-ttl.module.css";

export interface EditableTtlProps {
  value: number | null;
  isInherited?: boolean;
  allowInherit?: boolean;
  disabled?: boolean;
  expiresAt?: Date | null;
  editButtonAlwaysVisible?: boolean;
  onSubmit: (ttlSeconds: number | null) => Promise<boolean>;
}

export function EditableTtl({
  value,
  isInherited = false,
  allowInherit = false,
  disabled = false,
  expiresAt,
  editButtonAlwaysVisible = false,
  onSubmit,
}: EditableTtlProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const options = useMemo(
    () => buildTtlOptions({ t, searchText, allowInherit: allowInherit && !isInherited }),
    [allowInherit, isInherited, searchText, t]
  );

  const closeEditor = useCallback(() => {
    setIsEditing(false);
    setSearchText("");
  }, []);

  const submit = useCallback(
    async (optionValue: TtlOptionValue) => {
      if (isSubmittingRef.current) {
        return;
      }
      const nextTtl = optionValue === TTL_INHERIT_OPTION_VALUE ? null : optionValue;
      if (!isInherited && nextTtl === value) {
        closeEditor();
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      const isApplied = await onSubmit(nextTtl);
      isSubmittingRef.current = false;
      setIsSubmitting(false);

      if (isApplied) {
        closeEditor();
      }
    },
    [closeEditor, isInherited, onSubmit, value]
  );

  const handleBlur = useCallback(() => {
    if (isSubmittingRef.current) {
      return;
    }
    closeEditor();
  }, [closeEditor]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text.replace(/\D/g, ""));
  }, []);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape") {
        closeEditor();
      }
    },
    [closeEditor]
  );

  const stopKeyPropagation = useCallback((event: KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
  }, []);

  if (!isEditing) {
    const hint = [
      isInherited ? t("jobs.ttl-inherited-hint") : undefined,
      expiresAt ? t("jobs.ttl-expires-at", { time: formatTimeByUserTZ(expiresAt) }) : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    return (
      <span
        className={`${styles.root} prevent-row-click`}
        role="presentation"
        onKeyDown={stopKeyPropagation}
      >
        <Typography.Text type={isInherited ? "secondary" : undefined} title={hint || undefined}>
          {formatTtlValue(value, t)}
        </Typography.Text>

        {!disabled && (
          <span
            className={`${styles.editButton} ${editButtonAlwaysVisible ? styles.editButtonAlwaysVisible : ""}`}
          >
            <BaseActionButton
              icon={<EditOutlined />}
              title={t("jobs.ttl-edit")}
              onClick={() => setIsEditing(true)}
            />
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`${styles.root} prevent-row-click`}
      role="presentation"
      onKeyDown={stopKeyPropagation}
    >
      <Select<TtlOptionValue>
        className={styles.select}
        size="small"
        autoFocus
        defaultOpen
        showSearch
        filterOption={false}
        loading={isSubmitting}
        value={undefined}
        placeholder={formatTtlValue(value, t)}
        searchValue={searchText}
        onSearch={handleSearch}
        options={options}
        onChange={(optionValue) => {
          submit(optionValue).catch(() => undefined);
        }}
        onBlur={handleBlur}
        onInputKeyDown={handleInputKeyDown}
      />
    </span>
  );
}
