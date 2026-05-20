import { ImportOutlined } from "@ant-design/icons";
import { loader } from "@monaco-editor/react";
import {
  PageHeader,
  SlsEditor,
  type SlsEditorProps,
  slsEditorMonacoLoader,
} from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import * as monaco from "monaco-editor";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { slsEditorStore } from "saltbox-core/store";

import { ImportSlsModal } from "./components/import-sls-modal";
import { RawSlsEditor } from "./components/raw-sls-editor";
import styles from "./index.module.css";

loader.config({ monaco });
slsEditorMonacoLoader.config({ monaco });

const SlsEditorPage = observer(() => {
  const { t } = useTranslation();
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleSlsChange = (newSls: string) => {
    slsEditorStore.setSlsContent(newSls);
  };

  const handleOpenImportModal = () => {
    setImportModalOpen(true);
  };

  const handleImportSls = (importedSls: string) => {
    slsEditorStore.setSlsContent(importedSls);
  };

  const menuItems: SlsEditorProps["menu"]["items"] = [
    {
      key: "import",
      label: t("sls-editor.menu-import-from-template"),
      icon: <ImportOutlined />,
      onClick: handleOpenImportModal,
    },
  ];

  const additionalTabs = [
    {
      key: "raw-sls",
      title: t("sls-editor.tab-raw-sls"),
      content: (
        <RawSlsEditor
          sls={slsEditorStore.slsContent}
          onSlsChange={handleSlsChange}
          className={styles.rawEditor}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t("sls-editor.page-title")} />

      <SlsEditor
        sls={slsEditorStore.slsContent}
        onSlsChange={handleSlsChange}
        defaultTab="form-editor"
        additionalTabs={additionalTabs}
        className={styles.editor}
        menu={{ items: menuItems }}
      />

      <ImportSlsModal
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        onImport={handleImportSls}
      />
    </>
  );
});

export default SlsEditorPage;
