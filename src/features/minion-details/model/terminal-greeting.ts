import type { GrainsSchema } from "@saltbox/saltbox-core-api-client";

import type { TerminalCmdRunSettings } from "./terminal-cmd-settings";

const DEFAULT_VALUE = "default";
const CMD_RUN_PARAMS_PREFIX = "cmd.run: ";
const PRIORITY_KWARG_KEYS = ["shell", "cwd", "runas", "env"];
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

function sortKwargEntries(kwargs: Record<string, unknown>): Array<[string, unknown]> {
  const entries = Object.entries(kwargs);

  return [
    ...PRIORITY_KWARG_KEYS.flatMap((priorityKey) =>
      entries.filter(([name]) => name === priorityKey)
    ),
    ...entries.filter(([name]) => !PRIORITY_KWARG_KEYS.includes(name)),
  ];
}

export function formatMinionOsLine(grains: GrainsSchema): string {
  const osName = formatOsName(grains);
  const shell = (grains.shell ?? "").trim();

  if (!osName && !shell) {
    return "";
  }

  const shellPart = `shell=${shell || DEFAULT_VALUE}`;

  return osName ? `${osName}, ${shellPart}` : shellPart;
}

export function formatCmdRunParamsLine(settings: TerminalCmdRunSettings | null): string {
  const params = sortKwargEntries(settings?.kwargs ?? {})
    .filter(([, value]) => value != null && value !== "")
    .map(([name, value]) => `${name}=${formatParamValue(value)}`);

  if (settings?.ttlSeconds != null) {
    params.push(`timeout=${settings.ttlSeconds}s`);
  }

  return params.length ? `${CMD_RUN_PARAMS_PREFIX}${params.join(", ")}` : "";
}

export function formatCmdRunParamsChangeLine(settings: TerminalCmdRunSettings | null): string {
  return formatCmdRunParamsLine(settings) || `${CMD_RUN_PARAMS_PREFIX}${DEFAULT_VALUE}`;
}

export function buildTerminalGreeting(
  grains: GrainsSchema,
  settings: TerminalCmdRunSettings | null
): string[] {
  return [formatMinionOsLine(grains), formatCmdRunParamsLine(settings)].filter(
    (line) => line.length > 0
  );
}
