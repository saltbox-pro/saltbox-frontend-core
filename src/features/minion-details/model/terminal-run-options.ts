import type { GrainsSchema } from "@saltbox/saltbox-core-api-client";

import type { TerminalCmdRunSettings } from "./terminal-cmd-settings";

const OUTPUT_ENCODING_KWARG_KEY = "output_encoding";
const WINDOWS_OUTPUT_ENCODING = "cp866";
const WINDOWS_GRAIN_VALUE = "windows";

export function isWindowsMinion(grains: GrainsSchema | null | undefined): boolean {
  return [grains?.kernel, grains?.os_family, grains?.os].some(
    (value) => typeof value === "string" && value.trim().toLowerCase() === WINDOWS_GRAIN_VALUE
  );
}

export function buildEffectiveCmdRunSettings(
  grains: GrainsSchema | null | undefined,
  settings: TerminalCmdRunSettings | null
): TerminalCmdRunSettings | null {
  if (!isWindowsMinion(grains)) {
    return settings;
  }

  return {
    ...settings,
    kwargs: { [OUTPUT_ENCODING_KWARG_KEY]: WINDOWS_OUTPUT_ENCODING, ...settings?.kwargs },
  };
}
