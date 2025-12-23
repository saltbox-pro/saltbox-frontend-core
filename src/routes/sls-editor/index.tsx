import { HomeOutlined, ImportOutlined } from "@ant-design/icons";
import { loader } from "@monaco-editor/react";
import { PageHeader, SlsEditor, slsEditorMonacoLoader } from "@saltbox/saltbox-frontend-common";
import { Breadcrumb, MenuProps } from "antd";
import { observer } from "mobx-react-lite";
import * as monaco from "monaco-editor";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { slsEditorStore } from "saltbox-core/store";

import { ImportSlsModal } from "./components/import-sls-modal";
import { RawSlsEditor } from "./components/raw-sls-editor";
import styles from "./index.module.css";
import { useNavigate } from "react-router";

loader.config({ monaco });
slsEditorMonacoLoader.config({ monaco });

const SlsEditorPage = observer(() => {
  const navigate = useNavigate();
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

  const menuItems: MenuProps["items"] = [
    {
      key: "import",
      label: "Import from Template",
      icon: <ImportOutlined />,
      onClick: handleOpenImportModal,
    },
  ];

  const additionalTabs = [
    {
      key: "raw-sls",
      title: "Raw SLS",
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
      <PageHeader title="SLS Editor" />

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
