import { apiCoreStore } from "saltbox-core/store";

type DeleteExtraDataCategoryParams = {
  source: string;
  name: string;
};

export async function deleteExtraDataCategory({
  source,
  name,
}: DeleteExtraDataCategoryParams): Promise<void> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("extra-data-categories.delete.error");
  }

  await api.extraDataCategoryDelete({ source, name });
}
