export type CollectionDetailsDrawerOpenParams = {
  id: string;
  slug: string;
  isCreate?: boolean;
};

export type CollectionEditFormType = {
  title: string;
  description?: string;
  parent_slug: string;
};
