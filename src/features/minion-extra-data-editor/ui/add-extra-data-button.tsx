import { PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";

type AddExtraDataButtonProps = {
  onClick: () => void;
};

export function AddExtraDataButton({ onClick }: AddExtraDataButtonProps) {
  const { t } = useTranslation();

  return (
    <Button type="primary" icon={<PlusOutlined />} onClick={onClick}>
      {t("minions.extra-data.add-data")}
    </Button>
  );
}
