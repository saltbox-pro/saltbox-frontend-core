import { useMemo } from "react";
import { ValueEditorProps } from "react-querybuilder";
import { AntDValueEditor } from "@react-querybuilder/antd";
import { SaltBoxAutocompleteValueEditor } from "./salt-box-autocomplete-value-editor";
import { SaltBoxDateTimeValueEditor } from "./salt-box-datetime-value-editor";

export const SaltBoxMinionValueEditor = (slug: string) => {
  return useMemo(() => {
    return (props: ValueEditorProps) => {
      if (props?.inputType === "datetime-local") {
        if (
          props?.operator === "null" ||
          props?.operator === "notNull" ||
          props?.operator === "between" ||
          props?.operator === "notBetween"
        ) {
          return <></>;
        }
        return <SaltBoxDateTimeValueEditor {...props} />;
      }
      if (props.type === "checkbox") {
        return <AntDValueEditor {...props} />;
      }
      if (props.fieldData.inputType === undefined) {
        if (props?.operator === "null" || props?.operator === "notNull") {
          return <></>;
        }
        return <SaltBoxAutocompleteValueEditor {...props} slug={slug} />;
      }
      return <AntDValueEditor {...props} />;
    };
  }, [slug]);
};
