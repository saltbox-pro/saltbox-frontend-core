import {
  GetOptionsCallback,
  SaltBoxOptionsValueEditor,
  ValueEditorProps,
} from "@saltbox/saltbox-frontend-common";
import { FC, useMemo } from "react";

import { apiCoreStore } from "saltbox-core/store";

type CoreMinionValueEditorInnerProps = ValueEditorProps & { slug: string };

const createGetOptionsForCollection = (slug: string): GetOptionsCallback => {
  return (field, value, setOptions) => {
    apiCoreStore.filtersApi
      ?.filterValues({
        MinionFilterValuesBody: {
          collection_slug: slug,
          query: {
            [field]: {
              $regex: `(?i)${String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
            },
          },
          field,
        },
      })
      .then((result) => {
        setOptions(result.data.map((grain) => ({ value: grain.value as string })));
      })
      .catch(() => {
        setOptions([]);
      });
  };
};

const CoreMinionValueEditorInner: FC<CoreMinionValueEditorInnerProps> = ({ slug, ...props }) => {
  const getOptions = useMemo(() => createGetOptionsForCollection(slug), [slug]);
  return <SaltBoxOptionsValueEditor getOptions={getOptions} {...props} />;
};

export const CoreMinionValueEditor =
  (slug: string): FC<ValueEditorProps> =>
  (props) => <CoreMinionValueEditorInner slug={slug} {...props} />;
