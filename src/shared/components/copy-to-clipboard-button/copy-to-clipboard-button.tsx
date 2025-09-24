import { useTranslation } from "react-i18next";
import { Button, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import styles from "./copy-to-clipboard-button.module.css";

export function CopyToClipboardButton({ text }: { text: string }) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <>
      {contextHolder}
      <Button
        className={styles.buttonCopyToClipboard}
        icon={<CopyOutlined />}
        type="link"
        shape="circle"
        size="small"
        title={t("base.copy-to-clipboard")}
        onClick={() => {
          messageApi.success(t("base.copied-to-clipboard"));
          navigator.clipboard.writeText(text);
        }}
      />
    </>
  );
}
