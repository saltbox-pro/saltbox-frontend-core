import { ComponentProps, useCallback } from "react";
import { SaltBoxAutocompleteValueEditor, SaltBoxMinionValueEditor } from "@saltbox/saltbox-frontend-common";
import { apiCoreStore } from "saltbox-core/store";

type AutoCompleteProps = ComponentProps<typeof SaltBoxAutocompleteValueEditor>;
type MinionValueEditorProps = ComponentProps<typeof SaltBoxMinionValueEditor>;

export const CoreMinionValueEditor = (
  slug: string
) => (props: MinionValueEditorProps) => {
  const handleValueChange = useCallback<AutoCompleteProps["onValueChange"]>((setOptions) => {
    apiCoreStore.filtersApi
      ?.filterValues({
        MinionFilterValuesBody: {
          collection_slug: slug,
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
  }, [slug, props.field, props.value]);

  return <SaltBoxMinionValueEditor onValueChange={handleValueChange} {...props}  />
};
