import type { JobSchemaModel } from "@saltbox/saltbox-core-api-client";
import type { JsonFormRef } from "@saltbox/saltbox-frontend-common";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_JOB_TIMEOUT_SECONDS } from "saltbox-core/shared/constants/job-timeout";
import {
  cleanNullsFromKwargs,
  fetchJobFunctionSchema,
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
import { apiCoreStore } from "saltbox-core/store";

import {
  hasTerminalCmdRunParams,
  loadTerminalCmdRunSettings,
  omitDefaultKwargs,
  saveTerminalCmdRunSettings,
  type TerminalCmdRunSettings,
} from "../model/terminal-cmd-settings";

const TERMINAL_CMD_FUNCTION = "cmd.run";

export type TerminalCmdSettingsController = ReturnType<typeof useTerminalCmdSettings>;

export function useTerminalCmdSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSavedParams, setHasSavedParams] = useState(() =>
    hasTerminalCmdRunParams(loadTerminalCmdRunSettings())
  );
  const [saltFunction, setSaltFunction] = useState<JobSchemaModel>();
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [hasSchemaLoadError, setHasSchemaLoadError] = useState(false);
  const [ttlValue, setTtlValue] = useState<number | null>(null);
  const [ttlUnit, setTtlUnit] = useState<TtlUnit>("seconds");
  const [jsonFormValue, setJsonFormValue] = useState<Record<string, unknown>>({});

  const jsonFormRef = useRef<JsonFormRef>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const loadRequestIdRef = useRef(0);

  const schemaLayout = useMemo(
    () =>
      getOptionalJobParamsSchemaLayout(
        saltFunction?.json_schema as JsonSchemaRecord | undefined,
        saltFunction?.ui_schema as UiSchemaRecord | undefined
      ),
    [saltFunction]
  );

  const ttlPlaceholder = String(
    parseTtlValue(saltFunction?.default_ttl) ?? DEFAULT_JOB_TIMEOUT_SECONDS
  );

  const defaultKwargs = useMemo(
    () =>
      (getDefaultJsonFormValue(schemaLayout.displaySchema).kwargs ?? {}) as Record<string, unknown>,
    [schemaLayout.displaySchema]
  );

  const loadSchema = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;
    setIsSchemaLoading(true);
    setHasSchemaLoadError(false);

    try {
      const schema = await fetchJobFunctionSchema(TERMINAL_CMD_FUNCTION, (name) =>
        apiCoreStore.jsonSchemasApi?.jobsSchemasGet({ name })
      );
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      setSaltFunction(schema);
    } catch {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      setHasSchemaLoadError(true);
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsSchemaLoading(false);
      }
    }
  }, []);

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
    initializeFields();
    setIsOpen(true);
    if (!saltFunction && !isSchemaLoading) {
      loadSchema();
    }
  }, [initializeFields, isSchemaLoading, loadSchema, saltFunction]);

  const closeSettings = useCallback(() => {
    setIsOpen(false);
  }, []);

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
    setHasSavedParams(hasTerminalCmdRunParams(settings));
    setIsOpen(false);
  }, [defaultKwargs, jsonFormValue, schemaLayout.displaySchema, ttlUnit, ttlValue]);

  const resetFields = useCallback(() => {
    setTtlValue(null);
    setTtlUnit("seconds");
    setJsonFormValue({ kwargs: {} });
  }, []);

  const retrySchemaLoad = useCallback(() => {
    if (!isSchemaLoading) {
      loadSchema();
    }
  }, [isSchemaLoading, loadSchema]);

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
    hasSavedParams,
    isSchemaLoading,
    hasSchemaLoadError,
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
    saveSettings,
    resetFields,
    retrySchemaLoad,
  };
}
