export const NUMERIC_FIELD_NAMES = new Set([
  "num_cpus",
  "mem_total",
  "swap_total",
  "pid",
  "uid",
  "gid",
]);

export const BOOLEAN_FIELD_NAMES = new Set([
  "virtual",
  "zfs_support",
  "efi_secure_boot",
  "selinux",
]);

export const COMPLEX_FIELD_NAME_PARTS = [
  "interfaces",
  "ip_interfaces",
  "hwaddr_interfaces",
  "gpus",
];

export const DATE_FIELD_NAME_PARTS = [
  "date",
  "time",
  "created",
  "updated",
  "last_seen",
  "last_activity",
];

export const NUMERIC_METADATA_TYPES = ["number", "integer", "float", "double"];

export const BOOLEAN_METADATA_TYPES = ["boolean", "bool", "checkbox"];

export const DATE_METADATA_TYPES = ["date", "datetime", "time"];
