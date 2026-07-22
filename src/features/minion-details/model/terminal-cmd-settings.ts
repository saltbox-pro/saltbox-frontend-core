export type TerminalCmdRunSettings = {
  kwargs?: Record<string, unknown>;
  ttlSeconds?: number;
};

const TERMINAL_CMD_RUN_SETTINGS_STORAGE_KEY = "terminalCmdRunSettings";

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function hasTerminalCmdRunParams(settings: TerminalCmdRunSettings | null): boolean {
  if (!settings) {
    return false;
  }

  return (
    (settings.kwargs != null && Object.keys(settings.kwargs).length > 0) ||
    settings.ttlSeconds != null
  );
}

export function loadTerminalCmdRunSettings(): TerminalCmdRunSettings | null {
  const rawValue = localStorage.getItem(TERMINAL_CMD_RUN_SETTINGS_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(rawValue);
  } catch {
    return null;
  }

  if (!isPlainRecord(parsedValue)) {
    return null;
  }

  const settings: TerminalCmdRunSettings = {};

  if (isPlainRecord(parsedValue.kwargs) && Object.keys(parsedValue.kwargs).length > 0) {
    settings.kwargs = parsedValue.kwargs;
  }

  if (
    typeof parsedValue.ttlSeconds === "number" &&
    Number.isFinite(parsedValue.ttlSeconds) &&
    parsedValue.ttlSeconds >= 0
  ) {
    settings.ttlSeconds = parsedValue.ttlSeconds;
  }

  return hasTerminalCmdRunParams(settings) ? settings : null;
}

export function omitDefaultKwargs(
  kwargs: Record<string, unknown>,
  defaultKwargs: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(kwargs).filter(
      ([name, value]) =>
        value !== undefined && JSON.stringify(value) !== JSON.stringify(defaultKwargs[name])
    )
  );
}

export function saveTerminalCmdRunSettings(settings: TerminalCmdRunSettings): void {
  if (!hasTerminalCmdRunParams(settings)) {
    localStorage.removeItem(TERMINAL_CMD_RUN_SETTINGS_STORAGE_KEY);
    return;
  }

  localStorage.setItem(TERMINAL_CMD_RUN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
