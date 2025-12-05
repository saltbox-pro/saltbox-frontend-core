import { useState } from "react";
import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { PageHeader, SlsEditor } from "@saltbox/saltbox-frontend-common";
import { RawSlsEditor } from "./components/raw-sls-editor";

import styles from "./index.module.css";

const SlsEditorPage = observer(() => {
  const { t } = useTranslation();
  const [slsContent, setSlsContent] = useState<string>("");

  const handleSlsChange = (newSls: string) => {
    setSlsContent(newSls);
  };

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
      />
    </>
  );
});

export default SlsEditorPage;
