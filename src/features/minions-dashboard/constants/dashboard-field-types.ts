export const NUMERIC_FIELD_NAMES = new Set([
  "num_cpus",
  "mem_total",
  "swap_total",
  "pid",
  "uid",
  "gid",
]);

export const BOOLEAN_FIELD_NAMES = new Set(["zfs_support", "efi_secure_boot", "selinux"]);

export const COMPLEX_FIELD_NAME_PARTS = [
  "interfaces",
  "ip_interfaces",
  "hwaddr_interfaces",
  "gpus",
];

export const ALLOWED_GRAIN_FIELDS = new Set([
  "cpu_model",
  "osfullname",
  "boardname",
  "kernel",
  "saltversion",
  "pythonversion",
  "host",
  "fqdn",
  "master",
  "cpuarch",
  "os",
  "osfinger",
  "osrelease",
  "oscodename",
  "os_family",
  "osarch",
  "cwd",
  "localhost",
  "hwaddr_interfaces",
  "nodename",
  "kernelrelease",
  "kernelversion",
  "init",
  "lsb_distrib_id",
  "lsb_distrib_release",
  "lsb_distrib_codename",
  "biosversion",
  "biosvendor",
  "productname",
  "manufacturer",
  "biosreleasedate",
  "serialnumber",
  "virtual",
  "ps",
  "pythonexecutable",
  "saltpath",
  "zmqversion",
  "shell",
  "username",
  "groupname",
]);

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
