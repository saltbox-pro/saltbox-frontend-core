import {
  SaltBoxAutocompleteValueEditor,
  SaltBoxMinionValueEditor,
} from "@saltbox/saltbox-frontend-common";
import { ComponentProps, useCallback } from "react";

import { apiCoreStore } from "saltbox-core/store";

type AutoCompleteProps = ComponentProps<typeof SaltBoxAutocompleteValueEditor>;
type MinionValueEditorProps = ComponentProps<typeof SaltBoxMinionValueEditor>;

const CoreMinionValueEditorComponent = ({
  slug,
  ...props
}: MinionValueEditorProps & { slug: string }) => {
  const handleValueChange = useCallback<AutoCompleteProps["onValueChange"]>(
    (setOptions) => {
      apiCoreStore.filtersApi
        ?.filterValues({
          MinionFilterValuesBody: {
            collection_slug: slug,
            query: {
              [props.field]: {
                $regex: `(?i)${String(props.value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
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
    },
    [slug, props.field, props.value]
  );

  return <SaltBoxMinionValueEditor onValueChange={handleValueChange} {...props} />;
};

export const CoreMinionValueEditor = (slug: string) => (props: MinionValueEditorProps) => {
  return <CoreMinionValueEditorComponent slug={slug} {...props} />;
};
