import { SelectProps } from "antd";
import { DefaultOptionType } from "antd/es/select";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export type TargetTypeHint = {
  title: string;
  description: string;
  example: string;
  exampleDescription: string;
};

const targetTypes = [
  "glob",
  "pcre",
  "list",
  "grain",
  "grain_pcre",
  "pillar",
  "pillar_pcre",
  "nodegroup",
  "compound",
  "ipcidr",
];

export const useSaltTargetTypes = () => {
  const { t } = useTranslation();

  return useMemo(
    (): SelectProps<
      (typeof targetTypes)[number],
      DefaultOptionType & { hint?: TargetTypeHint }
    >["options"] =>
      targetTypes.map((type) => ({
        value: type,
        label: t(`salt-target-types.${type}.label`),
        title: "", // to remove the standard option hint
        hint: {
          title: t(`salt-target-types.${type}.hint.title`),
          description: t(`salt-target-types.${type}.hint.description`),
          example: t(`salt-target-types.${type}.hint.example`),
          exampleDescription: t(
            `salt-target-types.${type}.hint.exampleDescription`
          ),
        },
      })),
    [t]
  );
};
