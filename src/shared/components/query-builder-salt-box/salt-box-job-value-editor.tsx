import { JSX, useMemo } from "react";
import { ValueEditorProps } from "react-querybuilder";
import { AntDValueEditor } from "@react-querybuilder/antd";
import { SaltBoxDateTimeValueEditor } from "./salt-box-datetime-value-editor";
import { SaltBoxMultiselectValueEditor } from "./salt-box-multiselect-value-editor";

export function SaltBoxJobValueEditor(props: ValueEditorProps): JSX.Element {
  if (props?.inputType === "datetime-local") {
    return useMemo(() => <SaltBoxDateTimeValueEditor {...props} />, [props.value, props.values]);
  }
  if (
    props?.fieldData?.type === "multiselect" &&
    (props?.operator === "in" || props?.operator === "notIn")
  ) {
    return useMemo(() => <SaltBoxMultiselectValueEditor {...props} />, [props.value, props.values]);
  }
  return useMemo(() => <AntDValueEditor {...props} />, [props.value, props.values]);
};
