import { MaterialIconPicker } from "@saltbox/saltbox-frontend-common";
import { Form } from "antd";

import { EXTRA_DATA_CATEGORY_ICON_NAME } from "../constants/form-field-names";

type ExtraDataCategoryIconFormItemProps = {
  disabled?: boolean;
  readOnly?: boolean;
};

export function ExtraDataCategoryIconFormItem({
  disabled = false,
  readOnly = false,
}: ExtraDataCategoryIconFormItemProps) {
  return (
    <Form.Item name={EXTRA_DATA_CATEGORY_ICON_NAME} noStyle>
      <MaterialIconPicker disabled={disabled} readOnly={readOnly} />
    </Form.Item>
  );
}
