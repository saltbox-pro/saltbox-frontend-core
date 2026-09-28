import { FastTable, PageHeader } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExtraDataCategoriesTable } from "saltbox-core/features/extra-data-categories";
import { ExtraDataCategoriesStore } from "saltbox-core/store";

const ExtraDataCategoriesPage = observer(function ExtraDataCategoriesPage() {
  const { t } = useTranslation();
  const [store] = useState(() => new ExtraDataCategoriesStore());

  useEffect(() => {
    store.loadCategories();

    return () => {
      store.reset();
    };
  }, [store]);

  return (
    <>
      <PageHeader title={t("extra-data-categories.title")} />

      <FastTable.Provider>
        <div className="page-actions-buttons">
          <FastTable.Toolbar />
        </div>

        <ExtraDataCategoriesTable store={store} />
      </FastTable.Provider>
    </>
  );
});

export default ExtraDataCategoriesPage;
