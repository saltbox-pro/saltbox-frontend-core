import { useMemo } from "react";
import { ValueEditorProps } from "react-querybuilder";
import { AntDValueEditor } from "@react-querybuilder/antd";
import { SaltBoxDateTimeValueEditor } from "./salt-box-datetime-value-editor";
import { SaltBoxMultiselectValueEditor } from "./salt-box-multiselect-value-editor";

export const SaltBoxJobValueEditor = () => {
  return useMemo(() => {
    return (props: ValueEditorProps) => {
      if (props?.inputType === "datetime-local") {
        return <SaltBoxDateTimeValueEditor {...props} />;
      }
      if (
        props?.fieldData?.type === "multiselect" &&
        (props?.operator === "in" || props?.operator === "notIn")
      ) {
        return <SaltBoxMultiselectValueEditor {...props} />;
      }
      return <AntDValueEditor {...props} />;
    };
  }, []);
};
