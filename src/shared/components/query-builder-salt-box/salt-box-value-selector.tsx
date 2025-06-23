import {
  AntDValueSelector,
  AntDValueSelectorProps,
} from "@react-querybuilder/antd";

export const SaltBoxValueSelector = (props: AntDValueSelectorProps) => {
  return <AntDValueSelector {...props} showSearch />;
};
