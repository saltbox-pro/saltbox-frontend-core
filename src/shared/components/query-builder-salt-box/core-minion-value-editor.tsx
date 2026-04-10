import {
  GetOptionsCallback,
  SaltBoxOptionsValueEditor,
  ValueEditorProps,
} from "@saltbox/saltbox-frontend-common";
import { FC, useMemo } from "react";

import { apiCoreStore } from "saltbox-core/store";

type CoreMinionValueEditorInnerProps = ValueEditorProps & { slug: string };

const inFlightFilterValueRequests = new Map<string, Promise<string[]>>();
const toEditorOptions = (optionValues: string[]) =>
  optionValues.map((optionValue) => ({ value: optionValue }));

const getRequestKey = (slug: string, field: string, value: unknown) =>
  `${slug}::${field}::${String(value ?? "")}`;

const fetchFilterValues = (slug: string, field: string, value: string): Promise<string[]> => {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    apiCoreStore.filtersApi
      ?.filterValues({
        MinionFilterValuesBody: {
          collection_slug: slug,
          query: {
            [field]: {
              $regex: `(?i)${escapedValue}`,
            },
          },
          field,
        },
      })
      .then((result) => (result?.data ?? []).map((grain) => String(grain.value ?? "")))
      .catch(() => []) ?? Promise.resolve([])
  );
};

const createGetOptionsForCollection = (slug: string): GetOptionsCallback => {
  return (field, value, setOptions) => {
    const normalizedValue = String(value ?? "");
    const requestKey = getRequestKey(slug, field, normalizedValue);

    let requestPromise = inFlightFilterValueRequests.get(requestKey);
    if (!requestPromise) {
      requestPromise = fetchFilterValues(slug, field, normalizedValue);
      inFlightFilterValueRequests.set(requestKey, requestPromise);
    }

    requestPromise
      .then((optionValues) => {
        setOptions(toEditorOptions(optionValues));
      })
      .finally(() => {
        inFlightFilterValueRequests.delete(requestKey);
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
