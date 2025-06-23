import { useTranslation } from "react-i18next";
import { Button, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import styles from "./copy-to-clipboard-button.module.css";

export function CopyToClipboardButton({ text }: { text: string }) {
  const { t } = useTranslation();

  return (
    <>
      <Button
        className={styles.buttonCopyToClipboard}
        icon={<CopyOutlined />}
        type="text"
        shape="circle"
        size="small"
        title={t("base.copy-to-clipboard")}
        onClick={() => {
          message.success(t("base.copied-to-clipboard"));
          navigator.clipboard.writeText(text);
        }}
      />
    </>
  );
}
