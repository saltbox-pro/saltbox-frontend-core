import type { JsonFormRef } from "@saltbox/saltbox-frontend-common";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_JOB_TIMEOUT_SECONDS } from "saltbox-core/shared/constants/job-timeout";
import { CMD_RUN_JOB_SCHEMA, resolveBuiltinJobSchema } from "saltbox-core/shared/job-schemas";
import {
  cleanNullsFromKwargs,
  getDefaultJsonFormValue,
  isTimeoutInputKeyAllowed,
  isTimeoutPasteAllowed,
  parseTtlValue,
  totalSecondsToTtlParts,
  ttlPartsToTotalSeconds,
  type TtlUnit,
} from "saltbox-core/shared/utils/job-modal-utils";
import {
  getOptionalJobParamsSchemaLayout,
  hasJsonSchemaProperties,
  type JsonSchemaRecord,
  type UiSchemaRecord,
} from "saltbox-core/shared/utils/job-schema-split";

import {
  hasTerminalCmdRunParams,
  loadTerminalCmdRunSettings,
  omitDefaultKwargs,
  saveTerminalCmdRunSettings,
  type TerminalCmdRunSettings,
} from "../model/terminal-cmd-settings";

export type TerminalCmdSettingsController = ReturnType<typeof useTerminalCmdSettings>;

export function useTerminalCmdSettings() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [savedSettings, setSavedSettings] = useState<TerminalCmdRunSettings | null>(() =>
    loadTerminalCmdRunSettings()
  );
  const [ttlValue, setTtlValue] = useState<number | null>(null);
  const [ttlUnit, setTtlUnit] = useState<TtlUnit>("seconds");
  const [jsonFormValue, setJsonFormValue] = useState<Record<string, unknown>>({});

  const jsonFormRef = useRef<JsonFormRef>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  const hasSavedParams = savedSettings != null;

  const schemaLayout = useMemo(() => {
    const schema = resolveBuiltinJobSchema(CMD_RUN_JOB_SCHEMA, i18n.language);

    return getOptionalJobParamsSchemaLayout(
      schema.json_schema as JsonSchemaRecord,
      schema.ui_schema as UiSchemaRecord | undefined
    );
  }, [i18n.language]);

  const ttlPlaceholder = String(
    parseTtlValue(CMD_RUN_JOB_SCHEMA.defaults?.ttl) ?? DEFAULT_JOB_TIMEOUT_SECONDS
  );

  const defaultKwargs = useMemo(
    () =>
      (getDefaultJsonFormValue(schemaLayout.displaySchema).kwargs ?? {}) as Record<string, unknown>,
    [schemaLayout.displaySchema]
  );

  const defaultSettings = useMemo<TerminalCmdRunSettings>(
    () => ({ kwargs: defaultKwargs, ttlSeconds: Number(ttlPlaceholder) }),
    [defaultKwargs, ttlPlaceholder]
  );

  const initializeFields = useCallback(() => {
    const savedSettings = loadTerminalCmdRunSettings();
    const ttlParts =
      savedSettings?.ttlSeconds != null
        ? totalSecondsToTtlParts(savedSettings.ttlSeconds)
        : { value: null, unit: "seconds" as TtlUnit };

    setTtlValue(ttlParts.value);
    setTtlUnit(ttlParts.unit);
    setJsonFormValue({ kwargs: savedSettings?.kwargs ?? {} });
  }, []);

  const openSettings = useCallback(() => {
    if (!hasInitializedRef.current) {
      initializeFields();
      hasInitializedRef.current = true;
    }
    setIsOpen(true);
  }, [initializeFields]);

  const closeSettings = useCallback(() => {
    setIsOpen(false);
  }, []);

  const cancelSettings = useCallback(() => {
    initializeFields();
    setIsOpen(false);
  }, [initializeFields]);

  const toggleSettings = useCallback(() => {
    if (isOpen) {
      closeSettings();
      return;
    }
    openSettings();
  }, [closeSettings, isOpen, openSettings]);

  const saveSettings = useCallback(() => {
    if (
      hasJsonSchemaProperties(schemaLayout.displaySchema) &&
      jsonFormRef.current &&
      !jsonFormRef.current.validateForm()
    ) {
      return;
    }

    const formStateData = jsonFormRef.current?.state?.formData;
    const formData =
      formStateData && typeof formStateData === "object" && !Array.isArray(formStateData)
        ? (formStateData as Record<string, unknown>)
        : jsonFormValue;

    const kwargs = omitDefaultKwargs(
      cleanNullsFromKwargs(formData.kwargs as Record<string, unknown> | undefined),
      defaultKwargs
    );
    const ttlSeconds = ttlPartsToTotalSeconds(ttlValue, ttlUnit);

    const settings: TerminalCmdRunSettings = {
      ...(Object.keys(kwargs).length > 0 ? { kwargs } : {}),
      ...(ttlSeconds != null ? { ttlSeconds } : {}),
    };

    saveTerminalCmdRunSettings(settings);
    setSavedSettings(hasTerminalCmdRunParams(settings) ? settings : null);
    setIsOpen(false);
  }, [defaultKwargs, jsonFormValue, schemaLayout.displaySchema, ttlUnit, ttlValue]);

  const resetFields = useCallback(() => {
    setTtlValue(null);
    setTtlUnit("seconds");
    setJsonFormValue({ kwargs: {} });
  }, []);

  const handleTtlInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isTimeoutInputKeyAllowed(event)) {
      event.preventDefault();
    }
  }, []);

  const handleTtlInputPaste = useCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text") ?? "";
    if (!isTimeoutPasteAllowed(pasted)) {
      event.preventDefault();
    }
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!isOpen || !overlay) {
      return;
    }

    const handleOverlayKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeSettings();
      }
    };

    overlay.addEventListener("keydown", handleOverlayKeyDown);
    return () => {
      overlay.removeEventListener("keydown", handleOverlayKeyDown);
    };
  }, [closeSettings, isOpen]);

  return {
    isOpen,
    savedSettings,
    defaultSettings,
    hasSavedParams,
    schemaLayout,
    ttlValue,
    setTtlValue,
    ttlUnit,
    setTtlUnit,
    ttlPlaceholder,
    handleTtlInputKeyDown,
    handleTtlInputPaste,
    jsonFormValue,
    setJsonFormValue,
    jsonFormRef,
    overlayRef,
    toggleSettings,
    closeSettings,
    cancelSettings,
    saveSettings,
    resetFields,
  };
}
