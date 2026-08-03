import type { GrainsSchema } from "@saltbox/saltbox-core-api-client";

import type { TerminalCmdRunSettings } from "./terminal-cmd-settings";

const DEFAULT_VALUE = "default";
const SHELL_KWARG_KEY = "shell";
const TIMEOUT_PARAM_KEY = "timeout";
const PRIORITY_KWARG_KEYS = [SHELL_KWARG_KEY, "cwd", "runas", "env"];
const MAX_PARAM_VALUE_LENGTH = 80;

function formatOsName(grains: GrainsSchema): string {
  const name = (grains.osfullname || grains.os || grains.kernel || "").trim();
  const release = (grains.osrelease ?? "").trim();

  if (!name) {
    return release;
  }

  if (!release || name.split(/\s+/).includes(release)) {
    return name;
  }

  return `${name} ${release}`;
}

function formatParamValue(value: unknown): string {
  const text = typeof value === "string" ? value : (JSON.stringify(value) ?? String(value));

  return text.length > MAX_PARAM_VALUE_LENGTH ? `${text.slice(0, MAX_PARAM_VALUE_LENGTH)}…` : text;
}

function sortParamEntries(entries: Array<[string, unknown]>): Array<[string, unknown]> {
  return [
    ...PRIORITY_KWARG_KEYS.flatMap((priorityKey) =>
      entries.filter(([name]) => name === priorityKey)
    ),
    ...entries.filter(([name]) => !PRIORITY_KWARG_KEYS.includes(name)),
  ];
}

function getCmdRunParamEntries(settings: TerminalCmdRunSettings | null): Array<[string, unknown]> {
  return sortParamEntries(
    Object.entries(settings?.kwargs ?? {}).filter(([, value]) => value != null && value !== "")
  );
}

function formatParamLine([name, value]: [string, unknown]): string {
  return `${name}=${formatParamValue(value)}`;
}

function formatTimeoutLine(ttlSeconds: number): string {
  return `${TIMEOUT_PARAM_KEY}=${ttlSeconds}s`;
}

function resolveDefaultParamValue(
  name: string,
  defaults: TerminalCmdRunSettings | null,
  grains: GrainsSchema
): string {
  if (name === SHELL_KWARG_KEY) {
    return (grains.shell ?? "").trim() || DEFAULT_VALUE;
  }

  const defaultValue = defaults?.kwargs?.[name];

  return defaultValue != null && defaultValue !== ""
    ? formatParamValue(defaultValue)
    : DEFAULT_VALUE;
}

export function formatCmdRunParamLines(settings: TerminalCmdRunSettings | null): string[] {
  const lines = getCmdRunParamEntries(settings).map(formatParamLine);

  if (settings?.ttlSeconds != null) {
    lines.push(formatTimeoutLine(settings.ttlSeconds));
  }

  return lines;
}

export function buildCmdRunSettingsChangeLines(
  previousSettings: TerminalCmdRunSettings | null,
  settings: TerminalCmdRunSettings | null,
  defaults: TerminalCmdRunSettings | null,
  grains: GrainsSchema
): string[] {
  const previousEntries = getCmdRunParamEntries(previousSettings);
  const currentEntries = getCmdRunParamEntries(settings);
  const previousValues = new Map(
    previousEntries.map(([name, value]) => [name, formatParamValue(value)])
  );
  const currentNames = currentEntries.map(([name]) => name);

  const changedEntries = currentEntries.filter(
    ([name, value]) => previousValues.get(name) !== formatParamValue(value)
  );
  const resetEntries = previousEntries
    .filter(([name]) => !currentNames.includes(name))
    .map(([name]): [string, unknown] => [name, resolveDefaultParamValue(name, defaults, grains)]);

  const lines = sortParamEntries([...changedEntries, ...resetEntries]).map(formatParamLine);

  if (settings?.ttlSeconds !== previousSettings?.ttlSeconds) {
    if (settings?.ttlSeconds != null) {
      lines.push(formatTimeoutLine(settings.ttlSeconds));
    } else if (defaults?.ttlSeconds != null) {
      lines.push(formatTimeoutLine(defaults.ttlSeconds));
    } else {
      lines.push(`${TIMEOUT_PARAM_KEY}=${DEFAULT_VALUE}`);
    }
  }

  return lines;
}

export function formatMinionOsLine(
  grains: GrainsSchema,
  settings: TerminalCmdRunSettings | null
): string {
  const osName = formatOsName(grains);
  const hasShellOverride = getCmdRunParamEntries(settings).some(
    ([name]) => name === SHELL_KWARG_KEY
  );

  if (hasShellOverride) {
    return osName;
  }

  const shell = (grains.shell ?? "").trim();

  if (!osName && !shell) {
    return "";
  }

  const shellPart = `shell=${shell || DEFAULT_VALUE}`;

  return osName ? `${osName}, ${shellPart}` : shellPart;
}

export function buildTerminalGreeting(
  grains: GrainsSchema,
  settings: TerminalCmdRunSettings | null
): string[] {
  return [formatMinionOsLine(grains, settings), ...formatCmdRunParamLines(settings)].filter(
    (line) => line.length > 0
  );
}
