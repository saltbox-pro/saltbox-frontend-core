import { SelectProps } from "antd";

export const saltTargetTypes: SelectProps["options"] = [
  { value: "glob", label: "glob - Bash glob completion" },
  {
    value: "pcre",
    label: "pcre - Perl style regular expression",
  },
  { value: "list", label: "list - Python list of hosts" },
  {
    value: "grain",
    label: "grain - Match based on a grain comparison",
  },
  {
    value: "grain_pcre",
    label: "grain_pcre - Grain comparison with a regex",
  },
  { value: "pillar", label: "pillar - Pillar data comparison" },
  {
    value: "pillar_pcre",
    label: "pillar_pcre - Pillar data comparison with a regex",
  },
  { value: "nodegroup", label: "nodegroup - Match on nodegroup" },
  {
    value: "range",
    label: "range - Use a Range server for matching",
  },
  {
    value: "compound",
    label: "compound - Pass a compound match string",
  },
  {
    value: "ipcidr",
    label: "ipcidr - Match based on Subnet (CIDR notation) or IPv4 address.",
  },
];
