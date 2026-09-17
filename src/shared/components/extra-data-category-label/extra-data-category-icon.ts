import type { MatIcon } from "@saltbox/saltbox-frontend-common";
import type { ComponentProps } from "react";

type MaterialSymbol = ComponentProps<typeof MatIcon>["icon"];

const EXTRA_DATA_CATEGORY_ICONS = {
  softwares: "deployed_code",
  hardware: "computer",
  cpus: "memory",
  bios: "developer_board",
  memories: "memory_alt",
  storages: "hard_disk",
  drives: "database",
  videos: "photo_frame",
  sounds: "volume_up",
  networks: "lan",
  slots: "settings_input_component",
  batteries: "battery_0_bar",
  controllers: "dns",
  inputs: "keyboard_alt",
  usbdevices: "usb",
  local_users: "person",
  local_groups: "group",
  virtualmachines: "cloud",
  monitors: "monitor",
  printers: "print",
} as const satisfies Record<string, MaterialSymbol>;

export function getExtraDataCategoryIcon(name: string): MaterialSymbol | undefined {
  return EXTRA_DATA_CATEGORY_ICONS[name as keyof typeof EXTRA_DATA_CATEGORY_ICONS];
}
