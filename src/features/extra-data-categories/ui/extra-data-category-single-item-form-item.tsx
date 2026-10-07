import { QuestionCircleOutlined } from "@ant-design/icons";
import { Checkbox, Form, Tooltip, theme } from "antd";
import { useTranslation } from "react-i18next";

import { EXTRA_DATA_CATEGORY_IS_SINGLE_ITEM_NAME } from "../constants/form-field-names";

import formItemStyles from "./extra-data-category-form-item.module.css";

type ExtraDataCategorySingleItemFormItemProps = {
  disabled?: boolean;
};

export function ExtraDataCategorySingleItemFormItem({
  disabled = false,
}: ExtraDataCategorySingleItemFormItemProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  return (
    <Form.Item
      name={EXTRA_DATA_CATEGORY_IS_SINGLE_ITEM_NAME}
      valuePropName="checked"
      className={formItemStyles.flush}
    >
      <Checkbox disabled={disabled}>
        {t("extra-data-categories.create.field-single-item")}{" "}
        <Tooltip title={t("extra-data-categories.create.field-single-item-tooltip")}>
          <QuestionCircleOutlined style={{ color: token.colorTextSecondary, cursor: "help" }} />
        </Tooltip>
      </Checkbox>
    </Form.Item>
  );
}
