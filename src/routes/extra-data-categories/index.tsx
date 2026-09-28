import { PlusOutlined } from "@ant-design/icons";
import { FastTable, PageHeader } from "@saltbox/saltbox-frontend-common";
import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  CreateExtraDataCategoryModal,
  ExtraDataCategoriesTable,
} from "saltbox-core/features/extra-data-categories";
import { ExtraDataCategoriesStore } from "saltbox-core/store";

const ExtraDataCategoriesPage = observer(function ExtraDataCategoriesPage() {
  const { t } = useTranslation();
  const [store] = useState(() => new ExtraDataCategoriesStore());
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
            {t("extra-data-categories.add-category")}
          </Button>
          <FastTable.Toolbar />
        </div>

        <ExtraDataCategoriesTable store={store} />
      </FastTable.Provider>

      <CreateExtraDataCategoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={store.reloadFromFirstPage}
      />
    </>
  );
});

export default ExtraDataCategoriesPage;
