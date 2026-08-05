import type { GrainsSchema } from "@saltbox/saltbox-core-api-client";

import type { TerminalCmdRunSettings } from "./terminal-cmd-settings";

const OUTPUT_ENCODING_KWARG_KEY = "output_encoding";
const CYRILLIC_OUTPUT_ENCODING = "cp866";
const WINDOWS_GRAIN_VALUE = "windows";
const CYRILLIC_ENCODING_PATTERN = /1251|866|koi8/i;

function isWindowsMinion(grains: GrainsSchema | null | undefined): boolean {
  return [grains?.kernel, grains?.os_family, grains?.os].some(
    (value) => typeof value === "string" && value.trim().toLowerCase() === WINDOWS_GRAIN_VALUE
  );
}

function hasCyrillicEncoding(grains: GrainsSchema | null | undefined): boolean {
  const localeInfo = grains?.locale_info;

  return [localeInfo?.defaultencoding, localeInfo?.detectedencoding].some(
    (value) => typeof value === "string" && CYRILLIC_ENCODING_PATTERN.test(value)
  );
}

export function buildEffectiveCmdRunSettings(
  grains: GrainsSchema | null | undefined,
  settings: TerminalCmdRunSettings | null
): TerminalCmdRunSettings | null {
  if (!isWindowsMinion(grains) || !hasCyrillicEncoding(grains)) {
    return settings;
  }

  return {
    ...settings,
    kwargs: { [OUTPUT_ENCODING_KWARG_KEY]: CYRILLIC_OUTPUT_ENCODING, ...settings?.kwargs },
  };
}
