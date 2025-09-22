import { useEffect, useState } from "react";
import { ValueEditorProps } from "react-querybuilder";
import { AutoComplete, AutoCompleteProps } from "antd";
import { apiCoreStore } from "saltbox-core/store";

type AntDValueEditorProps = ValueEditorProps & {
  extraProps?: Record<string, any>;
  slug: string;
};

export const SaltBoxAutocompleteValueEditor = (props: AntDValueEditorProps) => {
  const [options, setOptions] = useState<AutoCompleteProps["options"]>([]);

  useEffect(() => {
    apiCoreStore.filtersApi
      ?.filterValues({
        MinionFilterValuesBody: {
          collection_slug: props.slug,
          query: {
            [props.field]: {
              $regex: `(?i)${String(props.value).replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              )}`,
            },
          },
          field: props.field,
        },
      })
      .then((result) => {
        setOptions(
          result.data.map((grain) => {
            return { value: grain.value as any }; //todo
          })
        );
      })
      .catch(() => {
        setOptions([]);
      });
  }, [props.field, props.value]);

  return (
    <AutoComplete
      options={options}
      value={props.value}
      title={props.title}
      className={props.className}
      disabled={props.disabled}
      onChange={(onChangeValue) => props.handleOnChange(onChangeValue)}
      {...props.extraProps}
      style={{ width: "100%" }}
    />
  );
};
