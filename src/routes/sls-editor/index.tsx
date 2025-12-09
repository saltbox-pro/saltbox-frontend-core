import { useState } from "react";
import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import { Breadcrumb, message, MenuProps } from "antd";
import {
  HomeOutlined,
  DownloadOutlined,
  CopyOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import { PageHeader, SlsEditor } from "@saltbox/saltbox-frontend-common";
import { RawSlsEditor } from "./components/raw-sls-editor";
import { ImportSlsModal } from "./components/import-sls-modal";

import styles from "./index.module.css";

const SlsEditorPage = observer(() => {
  const { t } = useTranslation();
  const [slsContent, setSlsContent] = useState<string>("");
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleSlsChange = (newSls: string) => {
    setSlsContent(newSls);
  };

  const hasUnsavedChanges = slsContent !== "";

  const handleDownload = () => {
    if (!slsContent) {
      message.warning("No content to download");
      return;
    }

    try {
      const blob = new Blob([slsContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `state.sls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success("SLS file downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      message.error("Failed to download SLS file");
    }
  };

  const handleCopyToClipboard = async () => {
    if (!slsContent) {
      message.warning("No content to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(slsContent);
      message.success("SLS content copied to clipboard");
    } catch (error) {
      console.error("Clipboard error:", error);
      message.error("Failed to copy to clipboard");
    }
  };

  const handleOpenImportModal = () => {
    setImportModalOpen(true);
  };

  const handleImportSls = (importedSls: string) => {
    setSlsContent(importedSls);
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "import",
      label: "Import from Template",
      icon: <ImportOutlined />,
      onClick: handleOpenImportModal,
    },
    {
      type: "divider",
    },
    {
      key: "download",
      label: "Download SLS",
      icon: <DownloadOutlined />,
      onClick: handleDownload,
    },
    {
      key: "copy",
      label: "Copy to Clipboard",
      icon: <CopyOutlined />,
      onClick: handleCopyToClipboard,
    },
  ];

  const additionalTabs = [
    {
      key: "raw-sls",
      title: "Raw SLS",
      content: (
        <RawSlsEditor
          sls={slsContent}
          onSlsChange={handleSlsChange}
          className={styles.rawEditor}
        />
      ),
    },
  ];

  return (
    <>
      <Breadcrumb
        items={[
          {
            href: "/",
            title: <HomeOutlined />,
          },
          {
            title: "SLS Editor",
          },
        ]}
      />

      <PageHeader title="SLS Editor" />

      <SlsEditor
        sls={slsContent}
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
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </>
  );
});

export default SlsEditorPage;
